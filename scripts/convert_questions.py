import json
import re
import os
import sys

def slugify(text):
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '_', text)
    return text.strip('_')

AREA_MAPPING = {
    "MER Door": {"id": "mer_door", "icon": "door-closed"},
    "Cabinet": {"id": "cabinet", "icon": "server"},
    "Power": {"id": "power", "icon": "zap"},
    "Roof": {"id": "roof", "icon": "hard-hat"},
    "Site": {"id": "site", "icon": "clipboard-check"},
    "AP": {"id": "access_points", "icon": "wifi"},
}

# Source -> Target
FILES = [
    ("DAS_QuestionSet.json", "packages/templates/cel_das_v1.json", "DAS"),
    ("DOT_QuestionSet.json", "packages/templates/cel_dot_v1.json", "DOT"),
]

def process_file(source_path, target_path, prefix):
    # Use absolute paths assuming script runs from project root
    base_dir = os.getcwd()
    abs_source = os.path.join(base_dir, source_path)
    abs_target = os.path.join(base_dir, target_path)

    print("Processing {} -> {}".format(abs_source, abs_target))

    with open(abs_source, 'r') as f:
        source_data = json.load(f)
    
    with open(abs_target, 'r') as f:
        target_data = json.load(f)
    
    questions = source_data['questions']
    
    # Group by Area -> Equipment
    buckets_map = {} # bucket_id -> {title, icon, order, groups: {group_id -> {title, order, questions}}}
    
    # Helper to maintain order
    bucket_order_list = []
    group_order_map = {} # bucket_id -> list of group_ids
    
    for q in questions:
        area = q['Area']
        equipment = q['Equipment']
        text = q['Question']
        q_id_num = q['Question_ID']
        
        # Map Area to Bucket
        if area in AREA_MAPPING:
            bucket_def = AREA_MAPPING[area]
            bucket_id = bucket_def['id']
            bucket_icon = bucket_def['icon']
        else:
            # Fallback
            bucket_id = slugify(area)
            bucket_icon = "clipboard-check"
            print("Warning: Unknown Area '{}', using id '{}'".format(area, bucket_id))
            
        bucket_title = area
        
        if bucket_id not in buckets_map:
            buckets_map[bucket_id] = {
                "bucket_id": bucket_id,
                "title": bucket_title,
                "icon": bucket_icon,
                "order": (len(bucket_order_list) + 1) * 10,
                "groups": {}
            }
            bucket_order_list.append(bucket_id)
            group_order_map[bucket_id] = []
            
        # Map Equipment to Group
        group_id = slugify(equipment)
        group_title = equipment
        
        if group_id not in buckets_map[bucket_id]['groups']:
            buckets_map[bucket_id]['groups'][group_id] = {
                "group_id": group_id,
                "title": group_title,
                "order": (len(group_order_map[bucket_id]) + 1) * 10,
                "questions": []
            }
            group_order_map[bucket_id].append(group_id)
            
        # Construct Question
        formatted_id = "Q-{}-{:03d}".format(prefix, q_id_num)
        
        cat_val = q.get('Cat')
        severity = None
        if cat_val == 1:
            severity = "critical"
        elif cat_val == 3:
            severity = "major"
        elif cat_val == 5:
            severity = "minor"

        new_q = {
            "question_id": formatted_id,
            "text": text,
            "answer_type": "tri_state",
            "required": True,
            "severity": severity
        }
        
        buckets_map[bucket_id]['groups'][group_id]['questions'].append(new_q)

    # Reconstruct Buckets List
    new_buckets = []
    for bid in bucket_order_list:
        b_data = buckets_map[bid]
        groups = []
        for gid in group_order_map[bid]:
            groups.append(b_data['groups'][gid])
        
        b_data['groups'] = groups
        new_buckets.append(b_data)
        
    target_data['buckets'] = new_buckets
    
    with open(abs_target, 'w') as f:
        json.dump(target_data, f, indent=2)
        
    print("Updated {} with {} questions.".format(target_path, len(questions)))

if __name__ == "__main__":
    for s, t, p in FILES:
        process_file(s, t, p)
