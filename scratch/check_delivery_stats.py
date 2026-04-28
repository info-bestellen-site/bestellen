import json

def check_stats():
    input_file = '/Users/paul/Documents/Entwicklung/Business_ideas/Bestellen/Leads/all-task-1.json'
    with open(input_file, 'r') as f:
        data = json.load(f)
    
    stats = {'true': 0, 'false': 0, 'missing': 0}
    for d in data:
        about = d.get('about') or []
        found = False
        if isinstance(about, list):
            for s in about:
                if s.get('id') == 'service_options':
                    for o in s.get('options', []):
                        if 'liefer' in o.get('name', '').lower() and 'abholung' not in o.get('name', '').lower():
                            found = True
                            if o.get('enabled') is True:
                                stats['true'] += 1
                            else:
                                stats['false'] += 1
                            break
                if found: break
        if not found:
            stats['missing'] += 1
    
    print(json.dumps(stats, indent=2))

if __name__ == "__main__":
    check_stats()
