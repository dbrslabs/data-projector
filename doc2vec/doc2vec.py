# python libs
import os, multiprocessing
from random import shuffle
import string

# gensim modules
from gensim import utils
from gensim.models.doc2vec import LabeledSentence
from gensim.models import Doc2Vec

'''
doc2vec on flat file of articles 
stored at data/articles in format:
<uid> <article text>
...
<uid> <article text>
'''

class LabeledLineDocs(object):
    ids = []

    def __init__(self, source):
        self.source = source
        # make sure that keys are unique
        with utils.smart_open(self.source) as fin:
            for line in fin:
                # split '<id> <text>' to get id
                idd = line.split(' ', 1)[0]
                self.ids.append(self.gen_id(idd))
        # assert all ids are unique
        assert len(set(self.ids)) == len(self.ids), 'prefixes non-unique'
    
    def __iter__(self):
        with utils.smart_open(self.source) as fin:
            for line in fin:
                yield LabeledSentence(self.labeled_sentence(line))
    
    def to_array(self):
        self.docs = []
        with utils.smart_open(self.source) as fin:
            for line in fin:
                self.docs.append(self.labeled_sentence(line))
        return self.docs
    
    def labeled_sentence(self, line):
        # split '<id> <text>'
        idd, text = line.split(' ', 1)
        # pass document into as list of words
        return LabeledSentence(utils.to_unicode(text).split(), [self.gen_id(idd)])

    def docs_perm(self):
        shuffle(self.docs)
        return self.docs

    def gen_id(self, idd):
        return 'DOC_%s' % idd


if __name__ == "__main__":
    from pprint import pprint
    import argparse

    parser = argparse.ArgumentParser(description='Train doc2vec on a corpus')
    # required
    parser.add_argument('-c','--corpus', required=True, help='path to the corpus file on which to train') 
    parser.add_argument('-o','--output', required=True, help='file path to output trained model')
    # doc2vec training parameters - not required.
    # NOTE: all defaults match gensims, except --sample.
    parser.add_argument('--dm', default=5, help='defines training algorithm. 0: distributed bag-of-words, 1: distributed-memory.')
    parser.add_argument('--min_count', default=5, help='ignore all words with total frequency lower than this.')
    parser.add_argument('--window', default=8, help='the maximum distance between the predicted word and context words used for prediction within a document.')
    parser.add_argument('--size', default=300, help='is the dimensionality of the feature vectors.')
    parser.add_argument('--sample', default=1e-5, help='threshold for configuring which higher-frequency words are randomly downsampled. 0 is off.')
    parser.add_argument('--negative', default=0, help='if > 0, negative sampling will be used, the int for negative specifies how many "noise words" should be drawn (usually between 5-20).')
    # convert Namespace to dict
    arg = vars(parser.parse_args())
    pprint('arguments:')
    pprint(arg)

    # defines model parameters
    cores = multiprocessing.cpu_count()
    params = { k: arg[k] for k in ['dm','min_count','window','size','sample','negative'] }
    model = Doc2Vec(workers=cores, **params)

    # builds the vocabulary. NOTE: ensure corpus is lowercase at the very least!
    articles = LabeledLineDocs(arg['corpus'])
    print 'building vocabulary'
    model.build_vocab(articles.to_array())

    # trains the model
    for epoch in range(10):
        print 'epoch:', epoch
        model.train(articles.docs_perm())

    modelfile = "{output}-dm{dm}-mincount{min_count}-window{window}-size{size}-sample{sample}-neg{negative}.d2v".format(arg)
    model.save(modelfile)
