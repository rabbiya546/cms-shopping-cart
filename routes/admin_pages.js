var express = require ('express');
var router = express.Router();

var mongoose = require ('mongoose');
// Get Page model
var Page = require('../models/page');

/*
*Get page index
*/
router.get('/', function (req, res) {
    console.log('showing all pages');
    
    Page.find({}).sort({sorting: 1}).exec(function (err, pages) {
        res.render('admin/pages', {
            pages: pages
        });
    });
});



/*
*Get add page
*/
router.get('/add-page', function(req,res){
    console.log("chall ja oje");    

    var title = "";
    var slug = "";
    var content = "";

    res.render('admin/add_page', {
        title: title,
        slug: slug,
        content: content
    });

});
/*
*Post add page
*/
router.post('/add-page', function(req,res){
    
    console.log("bahir aao");
    req.checkBody('title', 'Title must have a value.').notEmpty();
    req.checkBody('content', 'Content must have a value.').notEmpty();

    var title = req.body.title;
    var slug = req.body.slug.replace(/\s+/g, '-').toLowerCase();
    if (slug == "")
        slug = title.replace(/\s+/g, '-').toLowerCase();
    var content = req.body.content;

    var errors = req.validationErrors();
    if (errors) {
        res.render('admin/add_page', {
            errors: errors,
            title: title,
            slug: slug,
            content: content
        });
    }else {
        
        Page.findOne({slug: slug}, function (err, page) {
            if (page) {
                req.flash('danger', 'Page slug exists, choose another.');
                res.render('admin/add_page', {
                    title: title,
                    slug: slug,
                    content: content
                });
            } else {
                var page = new Page({
                    title: title,
                    slug: slug,
                    content: content,
                    sorting: 100
                });

                page.save(function (err) {
                    if (err)
                        return console.log(err);
                    Page.find({}).sort({sorting: 1}).exec(function (err, pages) {
                        if (err) {
                            console.log(err);
                        } else {
                            req.app.locals.pages = pages;
                        }
                    });

                    req.flash('success', 'Page Added!');
                    res.redirect('/admin/pages');
                });
            }
        });
    }

});

// Sort pages function
function sortPages(ids, callback) {
    var count = 0;

    for (var i = 0; i < ids.length; i++) {
        var id = ids[i];
        count++;

        (function (count) {
            Page.findById(id, function (err, page) {
                page.sorting = count;
                page.save(function (err) {
                    if (err)
                        return console.log(err);
                    ++count;
                    if (count >= ids.length) {
                        callback();
                    }
                });
            });
        })(count);

    }
}

/*
 * POST reorder pages
 */
router.post('/reorder-pages', function (req, res) {
    var ids = req.body['id[]'];

    sortPages(ids, function () {
        Page.find({}).sort({sorting: 1}).exec(function (err, pages) {
            if (err) {
                console.log(err);
            } else {
                req.app.locals.pages = pages;
            }
        });
    });

});
/*
 * GET edit page
 */
router.get('/edit-page/:slug', function (req, res) {

    Page.findOne({_id: req.params.slug}, function (err, page) {
        
        if (err)
            return console.log(err);
        console.log(page);
        res.render('admin/edit_page', {
            title: page.title,
            slug: page.slug,
            content: page.content,
            id: page._id
        });
    });

});

/*
 * POST edit page
 */
router.post('/edit-page/:slug', function (req, res) {

    req.checkBody('title', 'Title must have a value.').notEmpty();
    req.checkBody('content', 'Content must have a value.').notEmpty();

    var title = req.body.title;

    console.log('title is ' + title);
    var slug = req.body.slug.replace(/\s+/g, '-').toLowerCase();
    if (slug == "")
        slug = title.replace(/\s+/g, '-').toLowerCase();
    var content = req.body.content;
    var id = req.params.id;
    var id = mongoose.Types.ObjectId(req.body.id);

    var errors = req.validationErrors();

    if (errors) {
        res.render('admin/edit_page', {
            errors: errors,
            title: title,
            slug: slug,
            content: content,
            id: id
        });
        } else {
            console.log('no err found');
            Page.findOne({slug: slug, _id: {'$ne': id}}, function (err, page) {
                if (page) {
                    req.flash('danger', 'Page slug exists, choose another.');
                    res.render('admin/edit_page', {
                        title: title,
                        slug: slug,
                        content: content,
                        id: id
                    });
                } else {
                    Page.findById(id, function (err, page) {
                        if (err)
                            return console.log(err);
    
                        page.title = title;
                        page.slug = slug;
                        page.content = content;
    
                    page.save(function (err) {
                        if (err)
                            return console.log(err);
                            Page.find({}).sort({sorting: 1}).exec(function (err, pages) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    req.app.locals.pages = pages;
                                }
                            });
    
                        req.flash('success', 'Page Added!');
                        res.redirect('/admin/pages');
                });
            
            });
        }
    
        });
    }
});
 
/*
*Get delete page 
*/
router.get('/delete-page/:id', function (req, res) {
    console.log('delete the page with id ' + req.params.id);
    
    Page.findByIdAndRemove(req.params.id, function (err) {
        if (err)
            return console.log(err);
            Page.find({}).sort({sorting: 1}).exec(function (err, pages) {
                if (err) {
                    console.log(err);
                } else {
                    req.app.locals.pages = pages;
                }
            });

        req.flash('success', 'Page Deleted!');
        res.redirect('/admin/pages/');
    });
});

//Exports
module.exports = router;