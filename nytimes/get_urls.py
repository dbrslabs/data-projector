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

    # default return vals
    res, good = {}, True

    # attempt json decode
    try: res = r.json()['response']
    except ValueError as err:
        print err
        print "error decoding json"
        print "r = ", r
        good = False

    # verify valid json
    if good:
        good = valid_response_json(res,page)
    return res, good

def valid_response_json(res,page):
    if (not res or
        'docs' not in res or
        not res['docs'] or
        res['docs'] == [{}] or
        page > 100
    ):
        print "invalid response json", res
        return False
    return True

def daterange(start_date, end_date):
    for n in range(int ((end_date - start_date).days)):
        yield start_date + timedelta(n)

def num_pages(page,day,next_day):
    '''derive number of pages associated with a given query'''
    pages = -1 # error state
    res, good = get_page(page, day, next_day)
    if good:
        pages = (int(res['meta']['hits']) / 10) + 1
    return pages

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
        # get page of results from api
        res, good = get_page(page, day, next_day)
        # simply move on to next page if req was bad
        if not good: continue
        # save the articles to the db
        for doc in res['docs']:
            print doc['_id'], doc['web_url']
            db.articles.replace_one(doc, doc, upsert=True)
