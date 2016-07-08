# simple server that talks to a mongo backend

# mongo
from pymongo import MongoClient
client = MongoClient('mongodb://52.5.180.63') # elastic ip of mongo-dev
db = client.guardian.articlesv2
from bson.objectid import ObjectId

# flask
from flask import Flask, jsonify, request
from flask.ext.cors import CORS, cross_origin

# doc2vec
from gensim.models import Doc2Vec
# TODO load all models into lookup dict, change front-end to see many t-sne data.json
d2v = Doc2Vec.load('ml/doc2vec/models/articles-sections-Science/dm1-mincount5-window8-size100-sample1e-05-neg0.d2v')

app = Flask(__name__)
app.config['CORS_HEADERS'] = "Content-Type"
cors = CORS(app, resources={r"/*": {"origins": 'localhost'}})

def format_article(article):
    return {
        'id': str(article['_id']),
        'text': article['blocks']['body'][0]['bodyTextSummary'],
        'html': article['blocks']['body'][0]['bodyHtml'],
        # TODO shortened title?
        'title': article['webTitle'],
        'url': article['webUrl'],
    }

@app.route("/doc/<docid>", methods=['GET'])
@cross_origin(origin='localhost', headers=['Content-Type'])
def get_doc(docid):
    try:
        article = db.find_one({'_id': ObjectId(docid)})
        return jsonify(format_article(article))
    except Exception as err:
        pass

def most_similar_by_text(text):
    # query doc2vec model to find (ids,similarities) of the most similar documents
    similar_docids, similarities = zip(*d2v.docvecs.most_similar(docid))
    return similar_docids, similarities

def most_similar(docid_or_vector):
    '''query doc2vec model to find (ids,similarities) of the most similar documents'''
    similar_docids, similarities = zip(*d2v.docvecs.most_similar(docid_or_vector))
    return similar_docids, similarities

def get_docs_by_ids(docids):
    # lookup documents in mongo
    query_cursor = db.find({'_id': { '$in': [ObjectId(docid) for docid in docids] }})
    # evaluate mongo cursor and format articles
    docs = [format_article(a) for a in query_cursor]
    # re-order docs list to match order of similar_docids and similarity lists
    order = [similar_docids.index(a['id']) for a in docs]
    docs = [article for _, article in sorted(zip(order,docs))]
    return docs

def merge_docs_and_similarities(docs, similarities):
    # set doc2vec similarity of each article
    docs = [dict(art.items() + [('similarity',sim)]) for art,sim in zip(docs,similarities)]
    return docs

@app.route("/doc/<docid>/most_similar", methods=['GET'])
@cross_origin(origin='localhost', headers=['Content-Type'])
def get_doc_most_similar(docid):
    try:
        similar_docids, similarities = most_similar(docid)
        similar_docs = get_docs_by_ids(similar_docids)
        similar_docs = merge_docs_and_similarities(similar_docs, similarities)
        return jsonify({'most_similar': similar_docs})
    except Exception as err:
        pass


@app.route("/url/<url>/most_similar", methods=['GET'])
@cross_origin(origin='localhost', headers=['Content-Type'])
def get_url_most_similar(url):
    try:
        # TODO query guardian api to get article text
        # text = get_text_by_url(url)
        # TODO preprocess text the same as happened in the training of doc2vec
        # text = preprocess(text)
        # infer doc2vec vector of text
        tagged_text = TaggedDocument(words=text.split(), tags=['N/A'])
        vec = d2v.infer_vector(tagged_text.words)
        # find most similar docs by vector
        similar_docids, similarities = most_similar(vec)
        similar_docs = get_docs_by_ids(similar_docids)
        similar_docs = merge_docs_and_similarities(similar_docs, similarities)
        articles, similar_docids, similarities = most_similar_by_docid(docid)
        return jsonify({'most_similar': articles})
    except Exception as err:
        pass

if __name__ == "__main__":
    app.run()
