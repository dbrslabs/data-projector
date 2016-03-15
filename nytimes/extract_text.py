import string, json
printable = set(string.printable)

from newspaper import Article

def clean(dirty):
    # removes line breaks
    text = dirty.replace('\n', ' ')
    # removes non-printable chars
    text = filter(lambda x: x in printable, text)
    # compresses multiple spaces into one space
    return ' '.join(text.split())

articles = json.load(open('urls_business.bak.json'))
for article in articles:
    url = article['web_url']
    a = Article(url)
    a.download()
    a.parse()
    out = 'articles/' + article['_id']
    with open(out, 'w') as fout:
        cleaned = clean(a.title) + '. ' + clean(a.text)
        fout.write(cleaned)
