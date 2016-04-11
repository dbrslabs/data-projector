# python libs
import os, logging, sys, argparse
from datetime import datetime

# 3rd party
from pymongo import MongoClient

if __name__ == '__main__':
    # setup custom logging
    logfile = '{abspath}/log/{time}.log'.format(
        abspath = os.path.dirname(os.path.abspath(__file__)),
        time = datetime.now())
    logging.basicConfig(filename=logfile, level=logging.WARNING)

    # parse cmd line arguments
    parser = argparse.ArgumentParser(description='Creates doc2vec training data from guardian db')
    parser.add_argument('-o','--output', default="articles", help='file path to output data file')
    parser.add_argument('-s','--sections', nargs='+', type=str, default=[], help='list of sectionsNames for which to search')
    arg = parser.parse_args()

    # connect to mongoDB, get articles collection
    client = MongoClient('mongodb://localhost')
    articles = client.guardian.articlesv2

    # create data dir if it doesn't exist
    thisdir = os.path.abspath(os.path.dirname(__file__))
    datadir = os.path.join(thisdir,'data')
    if not os.path.exists(datadir): os.makedirs(datadir)

    # construct filename data will be written to
    out = os.path.join(datadir,
        "{output}-sections-{sections}".format(
            output = arg.output,
            sections = "-".join(arg.sections) if arg.sections else 'all'))

    # open outfile and begin writing articles
    with open(out, 'w') as outfile:

        # construct query from cmd line arguments
        query = {'type':'article'}
        if arg.sections: query.update({'sectionName': {'$in': arg.sections }})
        docs = articles.find(query)

        # iterate through documents and write text to out file
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
