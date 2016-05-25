// $ mongo --quiet guardian get_distinct_sections.js > sections.json
sections = db.articlesv2.aggregate({ $group: { _id: "$sectionName", count: { $sum:1 } } }).result
ascending = function(a,b) { 
    if (a.count < b.count) return 1;
    else return -1;
}
// print to stdout (hint: pipe output to file!)
printjson( sections.sort(ascending) )
