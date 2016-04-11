# python libs
import os, multiprocessing, linecache, argparse, logging
from random import shuffle
from pprint import pprint
from datetime import datetime
import string
printable = set(string.printable)

import numpy as np

# gensim modules
from gensim import utils
from gensim.models.doc2vec import TaggedDocument
from gensim.models import Doc2Vec
import gensim.models.doc2vec
assert gensim.models.doc2vec.FAST_VERSION > -1, "this will be painfully slow otherwise"

'''
doc2vec on flat file of articles 
stored at data/articles in format:
<uid> <article text>
...
<uid> <article text>
'''

class TaggedDocuments(object):
    # for now, tag ids are merely string versions of the doc id
    gen_id = str

    def __init__(self, source, cleaningfns=None):
        self.source = source

        if cleaningfns: self.cleaningfns = cleaningfns
        else: self.cleaningfns = [lambda x: x]

        # make sure that keys are unique
        ids = []
        with utils.smart_open(self.source) as fin:
            for line in fin:
                # split '<id> <text>' to get id
                idd = line.split(' ', 1)[0]
                ids.append(self.gen_id(idd))
        # assert all ids are unique
        assert len(set(ids)) == len(ids), 'prefixes non-unique'
        self.numdocs = len(ids)

        self.indices = xrange(self.numdocs)
    
    def __iter__(self):
        for idx in self.indices:
            lineno = idx + 1
            line = linecache.getline(self.source, lineno)
            #linecache.clearcache() # uncomment if storing file in memory isn't feasible
            yield self.tagged_sentence(line)

    def permute(self):
        '''randomly order how documents are iterated'''
        self.indices = np.random.permutation(self.numdocs)

    def tagged_sentence(self, line):
        # split '<id> <text>'
        idd, text = line.split(' ', 1)
        # clean text
        text = utils.to_unicode(text)
        for fn in self.cleaningfns:
            text = fn(text)
        # split on spaces and generate id
        return TaggedDocument(words=text.split(), tags=[self.gen_id(idd)])


if __name__ == "__main__":
    # parse cmd line arguments
    parser = argparse.ArgumentParser(description='Train doc2vec on a corpus')
    # required
    parser.add_argument('-c','--corpus', required=True, help='path to the corpus file on which to train') 
    parser.add_argument('-o','--output', default=None, help='file path to output trained model')
    # doc2vec training parameters - not required.
    # NOTE: all defaults match gensims, except --sample.
    parser.add_argument('--dm',        type=int,   default=1,    help='defines training algorithm. 0: distributed bag-of-words, 1: distributed-memory.')
    parser.add_argument('--min_count', type=int,   default=5,    help='ignore all words with total frequency lower than this.')
    parser.add_argument('--window',    type=int,   default=8,    help='the maximum distance between the predicted word and context words used for prediction within a document.')
    parser.add_argument('--size',      type=int,   default=300,  help='is the dimensionality of the feature vectors.')
    parser.add_argument('--sample',    type=float, default=1e-5, help='threshold for configuring which higher-frequency words are randomly downsampled. 0 is off.')
    parser.add_argument('--negative',  type=int,   default=0,    help='if > 0, negative sampling will be used, the int for negative specifies how many "noise words" should be drawn (usually between 5-20).')
    # convert Namespace to dict
    arg = vars(parser.parse_args())

    # set output to be the same name as the corpus file if not provided
    arg['output'] = arg['output'] if arg['output'] else os.path.basename(arg['corpus'])

    # get the directory in which this file resides
    thisdir = os.path.abspath(os.path.dirname(__file__))

    # setup custom logging
    logdir = os.path.join(thisdir,'log')
    if not os.path.exists(logdir): os.makedirs(logdir)
    logfile = os.path.join(logdir, '{time}.log'.format(thisdir=thisdir, time=datetime.now()))
    logging.basicConfig(filename=logfile, level=logging.WARNING)

    # get modelfile right away to prevent post-training program failure / bugs
    modelsdir = os.path.join(thisdir,'models/{output}'.format(**arg))
    if not os.path.exists(modelsdir): os.makedirs(modelsdir)
    modelfile = os.path.join(modelsdir,
        "dm{dm}-mincount{min_count}-window{window}-size{size}-sample{sample}-neg{negative}.d2v".format(**arg))

    # defines model parameters
    params = { k: arg[k] for k in ['dm','min_count','window','size','sample','negative'] }
    params.update({'workers': multiprocessing.cpu_count() })
    pprint('model parameters:')
    pprint(params)
    model = Doc2Vec(**params)

    # strip punctuation and ensure lower case
    strip_punct = lambda text: filter(lambda x: x in printable, text)
    lower = lambda text: text.lower()

    # builds the vocabulary
    print 'instantiating TaggedDocuments'
    articles = TaggedDocuments(arg['corpus'], [strip_punct, lower])
    print 'building vocabulary'
    model.build_vocab(articles)

    # trains the model
    for epoch in range(10):
        print 'epoch:', epoch
        articles.permute()
        model.train(articles)

    model.save(modelfile)
