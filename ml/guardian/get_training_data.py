# python libs
import os, logging, sys, argparse
from datetime import datetime

# 3rd party
from pymongo import MongoClient, DESCENDING

def date(s):
    try:
        return datetime.strptime(s, "%Y-%m-%d")
    except ValueError:
        msg = "Not a valid date: '{0} {1} {2}'.".format(y,m,d)
        raise argparse.ArgumentTypeError(msg)

if __name__ == '__main__':
    # parse cmd line arguments
    parser = argparse.ArgumentParser(description='Creates doc2vec training data from guardian db')
    parser.add_argument('-o','--output', default="articles", help='file path to output data file')
    parser.add_argument('-q','--quantity', default=0, type=int, help='number of documents, e.g. there are 51,760 articles but you only want 30,000')
    parser.add_argument('-s','--sections', nargs='+', type=str, default=[], 
        help=('list of sectionsNames for which to search. '
            'sections with >10k articles (see: sections.json): '
            'World news, Sport, Football, Media, Business, UK news, Opinion, Politics, Music, '
            'Life and Style, Society, Books, Film, Technology, Money, Education, Environment, '
            'US news, Travel, Stage, Culture, News, Global, From the Guardian, Art and design, '
            'Television & radio, Science, Fashion, From the Observer, Australia news'))
    parser.add_argument('-b','--begin', type=date, default=None, 
        help="the start date. format: YYYY MM DD")
    parser.add_argument('-e','--end', type=date, default=None, 
        help="the end date. format: YYYY MM DD")
    arg = parser.parse_args()

    # setup custom logging
    logfile = '{abspath}/logs/{time}.log'.format(
        abspath = os.path.dirname(os.path.abspath(__file__)),
        time = datetime.now())
    logging.basicConfig(filename=logfile, level=logging.WARNING)

    # connect to mongoDB, get articles collection
    client = MongoClient('mongodb://52.5.180.63')
    articles = client.guardian.articlesv2

    # create data dir if it doesn't exist
    thisdir = os.path.abspath(os.path.dirname(__file__))
    datadir = os.path.join(thisdir,'data')
    if not os.path.exists(datadir): os.makedirs(datadir)

    # construct filename data will be written to
    out = os.path.join(datadir,
        "{output}-sections-{sections}".format(
            output = arg.output,
            sections = "-".join(arg.sections) if arg.sections else 'all').replace(' ',''))

    # adds quantity to filename
    if arg.quantity:
        out = out + '-{}'.format(arg.quantity)

    # adds dates to filename
    if arg.begin: out = out + '-begin-{}'.format(arg.begin.isoformat().split('T')[0])
    if arg.end:   out = out + '-end-{}'.format(arg.end.isoformat().split('T')[0])

    # open outfile and begin writing articles
    with open(out, 'w') as outfile:

        # construct query from cmd line arguments
        query = {'type':'article'}

        if arg.sections:
            query.update({'sectionName': {'$in': arg.sections }})

        # adds publication date information to query
        if arg.begin and arg.end:  
            query.update({'publicationDateObj': { '$gte': arg.begin, '$lt': arg.end }})
        elif arg.begin:  
            query.update({'publicationDateObj': { '$gte': arg.begin }})
        elif arg.end:  
            query.update({'publicationDateObj': { '$lt': arg.end }})

        # sort in descending order so when we slice by quantity dates are still continguous
        docs = articles.find(query).sort('publicationDateObj', DESCENDING)

        # slice documents list to be of maximum length arg.quantity
        if arg.quantity and docs.count() > arg.quantity:
            docs = docs[0:arg.quantity-1]

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
