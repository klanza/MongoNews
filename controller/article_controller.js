const express = require('express');
// Require database models for notes/articles
const db = require('../models');
// Packages required for scraping
const axios = require('axios');
const cheerio = require('cheerio');


const router = express.Router();

// Routes

// GET route for scraping
router.get('/scrape', function(req, res) {
    // Axios replaces Request package -- supports ES6 promises
    axios.get('https://www.cnet.com/news/').then(function(response) {
        // Load website, save it to similar jQuery selector for scraping
        const $ = cheerio.load(response.data);

        // Easily grabbable stories on page located in this element
        $('div.col-5').each(function(i, element) {
            //
            let result = {};

            result.headline = $(this)
                .children('a')
                .children('h3')
                .text()
                .trim();
            result.link = $(this)
                .children('a')
                .attr('href');
            result.summary = $(this)
                .children('a')
                .children('p')
                .text()
                .trim();
            // Create a new 'Article'
            db.Article.create(result)
                .then(function(dbArticle) {
                    console.log(dbArticle);
                })
                .catch(function(err) {
                    return res.json(err);
                });
        });
        res.send('Scrape Complete');
    });
});

// GET route for all articles in the database
router.get('/articles', function(req, res) {
    db.Article.find({})
        .then(function(dbArticle) {
            res.json(dbArticle);
        })
        .catch(function(err) {
            res.json(err);
        });
});

// Index with 'Articles' and 'Notes'
router.get('/', function(req, res) {
    db.Article.find({})
        .then(function(dbArticle) {
            let hbsObject = {
                article: dbArticle,
            };
            // console.log(hbsObject);
            console.log(hbsObject);
            res.render('index', hbsObject);
        });
    // console.log(hbsObject);
});

// GET route for grabbing a specific 'Article' by id
// Then populates each 'Article' with its associated 'Notes'
router.get('/articles/:id', function(req, res) {
    // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
    db.Article.findOne({_id: req.params.id})
        // ..and populate all of the notes associated with it
        .populate('note')
        .then(function(dbArticle) {
            // If we were able to successfully find an Article with the given id, send it back to the client
            res.json(dbArticle);
        })
        .catch(function(err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});

// POST route for saving a specific 'Article' with its 'Note'
router.post('/articles/:id', function(req, res) {
    // Create a new note and pass the req.body to the entry
    db.Note.create(req.body)
        .then(function(dbNote) {
            // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
            // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
            // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
            return db.Article.findOneAndUpdate({_id: req.params.id}, {$push: {notes: dbNote._id}}, {new: true});
        })
        .then(function(dbArticle) {
            // If we were able to successfully update an Article, send it back to the client
            res.json(dbArticle);
        })
        .catch(function(err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});

  // Export routes for server.js to use.
  module.exports = router;

