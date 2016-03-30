from pymongo import MongoClient
import os
import logging
from datetime import datetime
import sys

if __name__ == '__main__':
    # setup custom logging
    logfile = 'logs/get-training-data-{}.log'.format(datetime.now())
    logging.basicConfig(filename=logfile, level=logging.WARNING)

    # connect to mongoDB, get articles collection
    client = MongoClient('mongodb://localhost')
    articles = client.guardian.articles

    with open('articles_raw', 'w') as outfile:
        docs = articles.find({'type':'article'})
        for i, doc in enumerate(docs):
            try:
                # get article text
                text = doc['blocks']['body'][0]['bodyTextSummary'].encode('utf8')
                # at a minimum, remove line breaks and make lowercase.
                # perform stemming, stopping, etc., elsewhere if desired.
                text = text.replace('\n', ' ').lower()
                # each line of the file is: "<docid> <text>"
                docid = str(doc['_id'])
                line = docid + ' ' + text + "\n"
                outfile.write(line)
                # print update every 1000 articles
                if i % 1000 == 0: print 'udpate:', i
            except Exception as err:
                print 'didnt write:', i
                logging.exception(err)
