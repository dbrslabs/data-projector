import string, json
printable = set(string.printable)

from newspaper import Article

# TODO split file into download raw articles and clean articles

def clean(dirty):
    # removes line breaks
    text = dirty.replace('\n', ' ')
    # removes non-printable chars
    text = filter(lambda x: x in printable, text)
    # lowercase
    text = text.lower()
    # TODO remove punctuation
    # TODO stem words using nltk?
    # compresses multiple spaces into one space
    return ' '.join(text.split())

articles = json.load(open('urls_business.bak.json'))
with open('data/articles', 'w') as fout:
    for a in articles:
        article = Article(a['web_url'])
        article.download()
        article.parse()
        cleaned = clean(article.title) + '. ' + clean(article.text)
        line = a['_id'] + " " + cleaned + "\n"
        fout.write(line)
