import json
import csv
from urllib.parse import urlparse

PLATFORM_DOMAINS = [
    'facebook.com', 'fb.com', 'instagram.com', 'instagr.am', 'google.com', 
    'google.de', 'business.site', 'goo.gl', 'linktr.ee', 't.me', 'whatsapp.com', 
    'youtube.com', 'yelp.com', 'tripadvisor.de', 'tripadvisor.com',
    'speisekartenweb.de', 'restaurantguru.com', 'eatbu.com', 'dish.co',
    'm.facebook.com', 'sites.google.com', 'yellow.pages.wwwcafe.de',
    'wwwcafe.de', 'oymaps.com', 'slurp.me', 'shoutout.wix.com', 'wixsite.com',
    'pizza-taxi.de', 'imbiss.info', 'speisekarte.de', 'gastrofix.com',
    'order.dish.co'
]

RESERVATION_DOMAINS = [
    'quandoo.de', 'opentable.de', 'thefork.de', 'bookatable.com', 
    'resmio.com', 'aleno.me', 'gastronovi.com', 'gastronovi.app'
]

DELIVERY_KEYWORDS = [
    'lieferservice', 'lieferdienst', 'delivery', 'bestellen', 
    'order online', 'pizza service', 'pizzaservice', 'bringdienst',
    'lieferung', 'lebensmittel-lieferservice', 'essen-lieferservice'
]

CONFIRMED_DELIVERY_PLATFORMS = [
    'lieferando.de', 'wolt.com', 'ubereats.com', 'pyszne.pl', 
    'takeaway.com', 'just-eat', 'foodora'
]

def is_platform_url(url):
    if not url or not isinstance(url, str) or url.strip() == "" or url.lower() == 'no link':
        return True
    
    url = url.strip().lower()
    for p in PLATFORM_DOMAINS:
        if p in url:
            return True
    for p in RESERVATION_DOMAINS:
        if p in url:
            return True
    for p in CONFIRMED_DELIVERY_PLATFORMS:
        if p in url:
            return True
    return False

def analyze():
    input_file = '/Users/paul/Documents/Entwicklung/Business_ideas/Bestellen/Leads/all-task-1.json'
    output_file = '/Users/paul/Documents/Entwicklung/Business_ideas/Bestellen/Leads/v2_filtered_leads.csv'
    
    print(f"Loading {input_file}...")
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    matches = []
    
    for entry in data:
        name = (entry.get('name') or '').lower()
        description = (entry.get('description') or '').lower()
        categories = ' '.join(entry.get('categories') or []).lower()
        website = entry.get('website') or ''
        order_links = entry.get('order_online_links') or []
        
        # Check if they lack an own website
        no_own_website = is_platform_url(website)
        
        # Check for platform vs own ordering system
        has_order_link = (len(order_links) > 0) or (website and is_platform_url(website))
        all_order_links_are_safe_platforms = True
        has_delivery_platform = False
        has_reservation_platform = False
        
        # Check website field for platforms
        if website:
            web_lower = website.lower()
            if any(p in web_lower for p in CONFIRMED_DELIVERY_PLATFORMS):
                has_delivery_platform = True
            elif any(p in web_lower for p in RESERVATION_DOMAINS):
                has_reservation_platform = True
                all_order_links_are_safe_platforms = False

        # Check order_online_links
        for l in order_links:
            link = l.get('link', '').lower()
            if any(p in link for p in CONFIRMED_DELIVERY_PLATFORMS):
                has_delivery_platform = True
            elif any(p in link for p in RESERVATION_DOMAINS):
                has_reservation_platform = True
                all_order_links_are_safe_platforms = False
            elif any(p in link for p in PLATFORM_DOMAINS):
                pass
            else:
                if link and link != 'no link':
                    all_order_links_are_safe_platforms = False
        
        # Perfect Lead: Confirmed Delivery Platform AND No own system AND No reservations
        is_perfect_lead = has_delivery_platform and all_order_links_are_safe_platforms and not has_reservation_platform

        # Check "about" field for explicit "Lieferdienst" checkmark
        about_data = entry.get('about') or []
        explicit_service_delivery = False
        if isinstance(about_data, list):
            for section in about_data:
                if section.get('id') == 'service_options':
                    for option in section.get('options', []):
                        opt_name = option.get('name', '').lower()
                        if ('liefer' in opt_name or 'delivery' in opt_name) and option.get('enabled') is True:
                            if 'abholung' not in opt_name and 'mitnehmen' not in opt_name:
                                explicit_service_delivery = True
                                break
        
        combined_text = f"{name} {description} {categories}"
        has_delivery_keyword = any(k in combined_text for k in DELIVERY_KEYWORDS)
        
        # Criteria for "Perfect Lead":
        # 1. Has explicit delivery checkmark (✓) OR is confirmed via platform link
        # 2. AND Has NO reservation system (Quandoo, etc.)
        # 3. AND Has NO own website/ordering system
        
        is_delivery_candidate = explicit_service_delivery or has_delivery_platform
        
        if is_delivery_candidate and all_order_links_are_safe_platforms and not has_reservation_platform:
            if no_own_website:
                if has_delivery_platform:
                    entry['match_reason'] = "perfect_lead_platform_dependent"
                else:
                    entry['match_reason'] = "perfect_lead_no_digital_system"
                
                entry['is_platform_order'] = has_delivery_platform
                entry['categories_str'] = categories
                entry['order_links_str'] = '; '.join([l.get('link', '') for l in order_links])
                matches.append(entry)

    print(f"Found {len(matches)} perfect matches.")
    
    # Print stats
    domain_counts = {}
    for entry in data:
        web = entry.get('website') or ''
        if web and web.lower() != 'no link':
            try:
                u = web if '://' in web else 'http://' + web
                domain = urlparse(u).netloc.lower()
                if domain.startswith('www.'): domain = domain[4:]
                if domain:
                    domain_counts[domain] = domain_counts.get(domain, 0) + 1
            except: pass
    
    print("\nTop 20 Domains:")
    sorted_domains = sorted(domain_counts.items(), key=lambda x: x[1], reverse=True)
    for domain, count in sorted_domains[:20]:
        print(f"{domain:<30} {count}")

    if matches:
        fieldnames = [
            'name', 'website', 'match_reason', 'is_platform_order', 
            'phone', 'address', 'rating', 'reviews', 
            'categories_str', 'order_links_str', 'link'
        ]
        with open(output_file, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
            writer.writeheader()
            writer.writerows(matches)
        print(f"Saved to {output_file}")

if __name__ == "__main__":
    analyze()
