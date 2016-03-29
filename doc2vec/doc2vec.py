# python libs
import os, multiprocessing
from random import shuffle

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
                idd = line.split(' ', 1)[0]
                self.ids.append(self.gen_id(idd))
        assert len(set(self.ids)) == len(self.ids), 'prefixes non-unique'
    
    def __iter__(self):
        with utils.smart_open(self.source) as fin:
            for line in fin:
                idd, text = line.split(' ', 1)
                yield LabeledSentence(utils.to_unicode(text).split(), [self.gen_id(idd)])
    
    def to_array(self):
        self.docs = []
        with utils.smart_open(self.source) as fin:
            for line in fin:
                idd, text = line.split(' ', 1)
                self.docs.append(LabeledSentence(utils.to_unicode(text).split(), [self.gen_id(idd)]))
        return self.docs
    
    def docs_perm(self):
        shuffle(self.docs)
        return self.docs

    def gen_id(self, idd):
        return 'DOC_%s' % idd


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description='Train doc2vec on a corpus')
    parser.add_argument('-c','--corpus', required=True, help='path to the corpus file on which to train') 
    parser.add_argument('-o','--output', required=True, help='file path to output trained model')
    args = parser.parse_args()

    cores = multiprocessing.cpu_count()
    articles = LabeledLineDocs(args.corpus)

    # defines model parameters
    model = Doc2Vec(min_count=1, window=10, size=30, sample=1e-4, negative=5, workers=cores)
    # builds the vocabulary
    print 'building vocabulary'
    model.build_vocab(articles.to_array())

    # trains the model
    for epoch in range(10):
        print 'epoch:', epoch
        model.train(articles.docs_perm())

    model.save(output)
