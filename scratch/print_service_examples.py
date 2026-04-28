import json

def print_examples():
    input_file = '/Users/paul/Documents/Entwicklung/Business_ideas/Bestellen/Leads/all-task-1.json'
    with open(input_file, 'r') as f:
        data = json.load(f)
    
    # Let's pick 10 restaurants with "Lieferdienst" enabled
    count = 0
    print(f"{'Restaurant Name':<40} | {'Service options'}")
    print("-" * 80)
    
    for entry in data:
        about = entry.get('about') or []
        found_delivery = False
        options_list = []
        
        if isinstance(about, list):
            for section in about:
                if section.get('id') == 'service_options':
                    for option in section.get('options', []):
                        status = "✓" if option.get('enabled') else "✗"
                        options_list.append(f"{option.get('name')}: {status}")
                        if 'liefer' in option.get('name', '').lower() and option.get('enabled'):
                            found_delivery = True
        
        if found_delivery:
            name = entry.get('name', 'N/A')
            options_str = " | ".join(options_list)
            print(f"{name[:40]:<40} | {options_str}")
            count += 1
            if count >= 15:
                break

if __name__ == "__main__":
    print_examples()
