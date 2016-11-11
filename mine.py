from guardianClient import GuardianClient
from pymongo import MongoClient
import os
import logging
import datetime
import sys

logging.basicConfig(filename="miner-" + str(datetime.datetime.now()) + ".log",
                    level=logging.DEBUG)

# connect to mongoDB
mongo_user = os.getenv("GUARDIAN_MONGO_USERNAME")
mongo_password = os.getenv("GUARDIAN_MONGO_PASSWORD")
mongo_db = os.getenv("GUARDIAN_MONGO_DB")
mongo_url = os.getenv("GUARDIAN_MONGO_URL")
db_name = os.getenv("GUARDIAN_MONGO_DB")
mongo_client = MongoClient(
    "mongodb://" + mongo_user + ":" + mongo_password + "@" +
    mongo_url+ "/" + db_name)

# get articles collection
db = mongo_client.guardian
articles = db.articlesv2

# get page to start on
if len(sys.argv) > 1:
    current_page = int(sys.argv[1])
else:
    current_page = 1

print 'Mining starting from page ' + str(current_page)

# mine articles
total_pages = float("inf")
client = GuardianClient()
while current_page <= total_pages:
    response = client.all_content_search(page=current_page).json().get("response")
    for article in response.get("results"):
        article['date_mined'] = datetime.datetime.now()
        webPubDate = response.get("WebPublicationDate")
        y,m,d = webPubDate.split("-")
        # split month up from the time
        d = d.split("T")[0]
        # if year is 2000 indexed, add 2 to thousands place
        if y[0] == "0":
            y = "2" + y[1:]
        dateObj = datetime.datetime(int(y), int(m), int(d))
        article['publicationDateObj'] = dateObj
        articles.insert(article)
    # log page was mined
    logging.debug(str(datetime.datetime.now()) + ' Wrote '+ str(current_page) + ' to mongodb')
    current_page = current_page + 1
    total_pages = response.get("pages")
