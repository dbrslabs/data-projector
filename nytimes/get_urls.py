# python libs
import urllib, time, json
from datetime import timedelta, date

# 3rd party
import requests
from pymongo import MongoClient
client = MongoClient() # localhost, 27017
db = client.nytimes

# api keys
from keys import API_SEARCH_KEY

apiurl = "http://api.nytimes.com/svc/search/v2/articlesearch.json?%s"

def get_page(page, begin_date, end_date):
    query = urllib.urlencode({
        "api-key": "bf76eefea5bf8d1e10bb0211b902dafe:11:74719924",
        "begin_date": begin_date.strftime("%Y%m%d"),
        "end_date": end_date.strftime("%Y%m%d"),
        "sort": "newest",
        "fl": "_id,web_url,pub_date,print_page,headline,keywords,word_count,byline,news_desk",
        "fq": 'source:("The New York Times") AND type_of_material:("News")',
        "page": page,
    })
    check_sleep()
    r = requests.get(apiurl % query)
    return r.json()['response']

def daterange(start_date, end_date):
    for n in range(int ((end_date - start_date).days)):
        yield start_date + timedelta(n)

#print 'hits:', res['meta']['hits'], 'pages:', pages

def num_pages(page,day,next_day):
    '''derive number of pages associated with a given query'''
    res = get_page(page, day, next_day)
    return (int(res['meta']['hits']) / 10) + 1

def short_circuit(res, page):
    '''short-circuit if no results in response'''
    if 'docs' not in res: return True
    if not res['docs']: return True
    if res['docs'] == [{}]: return True
    if page > 100: return True
    return False

sleep_counter = 0
def check_sleep():
    '''sleep for 1 second every 10 requests bc: rate limiting'''
    global sleep_counter
    sleep_counter += 1
    if sleep_counter % 10 == 0: time.sleep(1)

start_date = date(2000, 1, 1)
end_date   = date(2016, 3, 14)
for idx, day in enumerate(daterange(start_date, end_date)):
    print day
    # each query is a 1 day span ensuring we dont hit the 100-page limit
    next_day = day + timedelta(days=1)
    pages = num_pages(0, day, next_day)
    for page in xrange(0, pages):
        print 'page:', page
        # get page or results from api
        res = get_page(page, day, next_day)
        # check if we should emergency move onto next query
        # so as to not break the script after hours of running
        if short_circuit(res,page): break
        # save the articles to the db
        for doc in res['docs']:
            print doc['_id'], doc['web_url']
            db.articles.replace_one(doc, doc, upsert=True)
