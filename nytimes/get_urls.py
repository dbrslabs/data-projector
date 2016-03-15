import urllib, time, json
from pprint import pprint

import requests

from keys import API_SEARCH_KEY

apiurl = "http://api.nytimes.com/svc/search/v2/articlesearch.json?%s"

# TODO paginate by iterating through begin and end dates yo!

def get_page(page):
    query = urllib.urlencode({
        "api-key": "bf76eefea5bf8d1e10bb0211b902dafe:11:74719924",
        "begin_date": "20150101",
        "end_date": "20160315",
        "sort": "newest",
        "fl": "_id,web_url,headline",
        "fq": 'section_name:("Business" "Business Day") AND source:("The New York Times") AND type_of_material:("News")',
        "page": page,
    })
    r = requests.get(apiurl % query)
    return r.json()['response']

# get first page of results to derive number of pages
res = get_page(0)
pages = (int(res['meta']['hits']) / 10) + 1
print 'hits:', res['meta']['hits'], 'pages:', pages
docs = res['docs']

# request all pages
for page in xrange(1,pages):
    print 'page:', page
    if page == 101:
        from pdb import set_trace
        set_trace();
        x = 1

    res = get_page(page)
    docs = docs + res['docs']
    # bc: rate limiting
    if page % 10 == 0:
        time.sleep(1)
        # overwrite entire json to save checkpoint incase script breaks
        with open('urls_business.json', 'w') as f:
            json.dump(docs, f)
