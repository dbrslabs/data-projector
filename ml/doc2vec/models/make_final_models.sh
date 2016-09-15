#!/bin/bash

# this script is specific to the super computer
# I committed it to git to ensure we don't lose it

DIR="final"

# conditionally override name of DIR to be first argument into script
if [ ! -z "$1" ]
then
    DIR=$1
fi

mkdir $DIR
cp articles-sections-Business-20000/dm1-mincount5-window8-size25-sample1e-05-neg0.d2v $DIR/business.d2v
cp articles-sections-Film-20000/dm1-mincount5-window8-size25-sample1e-05-neg0.d2v $DIR/film.d2v
cp articles-sections-Football-20000/dm1-mincount5-window8-size25-sample1e-05-neg0.d2v $DIR/football.d2v
cp articles-sections-Money-20000/dm1-mincount5-window8-size25-sample1e-05-neg0.d2v $DIR/money.d2v
cp articles-sections-Music-20000/dm1-mincount5-window8-size25-sample1e-05-neg0.d2v $DIR/music.d2v
cp articles-sections-Politics-20000/dm1-mincount5-window8-size25-sample1e-05-neg0.d2v $DIR/politics.d2v
cp articles-sections-Science/dm1-mincount5-window8-size30-sample1e-05-neg0.d2v $DIR/science.d2v
cp articles-sections-Sport-20000/dm1-mincount5-window8-size25-sample1e-05-neg0.d2v $DIR/sport.d2v
cp articles-sections-Technology-20000/dm1-mincount5-window8-size25-sample1e-05-neg0.d2v $DIR/technology.d2v
cp articles-sections-Travel-20000/dm1-mincount5-window8-size25-sample1e-05-neg0.d2v $DIR/travel.d2v
cp articles-sections-Worldnews-20000/dm1-mincount5-window8-size25-sample1e-05-neg0.d2v $DIR/worldnews.d2v

# if you want to archive and compress these run
# tar -cvzf $DIR.tar.gz $DIR
