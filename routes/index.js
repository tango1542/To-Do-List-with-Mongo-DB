var express = require('express');
var router = express.Router();
var ObjectID = require('mongodb').ObjectID

/* GET home page. */
router.get('/', function(req, res, next) {

  req.tasks.find( {completed: false}).toArray().then( (docs) => {
     res.render('index', { title: 'Incomplete Tasks', tasks: docs })
   }).catch( (err) => {
     next(err);
   });
});

router.get('/task/:_id', function(req, res, next) {

  var _id = req.params._id;

  if (!ObjectID.isValid(_id)) {
    var notFound = Error('Not found');
    notFound.status = 404;
    next(notFound);
  }

  else {
    req.tasks.findOne({_id: ObjectID(_id)})
      .then((doc) => {
        if (doc == null) {
          var notFound = Error('Not found');
          notFound.status = 404;
          next(notFound);
        } else {
          res.render('task', {title: 'Task', task: doc});
        }
      })
      .catch((err) => {
        next(err);
      })
  }
});

router.post('/add', function(req, res, next){

  if (!req.body || !req.body.text) {
    req.flash('error', 'please enter a task');
    //no task text info, redirect to home page with flash message
    // req.flash('error', 'please enter a task');
    res.redirect('/');
  }

  else {
    // Insert into database. New tasks are assumed to be not completed.
    req.tasks.insertOne({text: req.body.text, completed: false})
      .then(() => {
        res.redirect('/');
      })
      .catch((err) => {
        next(err);   // most likely to be a database error.
      });
  }

});

router.post ('/delete', function (req, res, next) {
  req.tasks.findOneAndDelete({_id: ObjectID(req.body._id)})
  .then((result) => {
    if (result.lastErrorObject.n ===1) {
      res.redirect('/');
    } else {
      var notFound = Error ('Task not found');
      notFound.status = 404;
      next(notFound);
    }
  })
  .catch( (err) => {

  });
});

router.get('/completed', function(req, res, next) {

  req.tasks.find( {completed: true} ).toArray()
  .then( (docs) => {
    res.render('tasks_completed', { title: 'Completed tasks' , tasks: docs });

  }).catch( (err) => {
    next(err);
  });
});
router.post('/done', function(req, res, next) {

  var _id = req.body._id;

  if (!ObjectID.isValid(_id)) {
    var notFound = Error('Not found');
    notFound.status = 404;
    next(notFound);
  }

  else {

  req.tasks.findOneAndUpdate({_id: ObjectID(req.body._id)}, {$set: {completed: true}})
        .then((result) => {
          // count how many things were updated. Expect to be 1.
          if (result.lastErrorObject.n === 1) {
            res.redirect('/');
          } else {
            // The task was not found. Report 404 error.
            var notFound = Error('Task not found');
            notFound.status = 404;
            next(notFound);
          }
        })
        .catch((err) => {
          next(err);        // For database errors, or malformed ObjectIDs.
        });
      }
  });

router.post('/alldone', function(req, res, next) {
  req.tasks.updateMany( {completed: false }, { $set : { completed : true}} )
  .then( (result) => {
    res.redirect('/');
  })
  .catch ( (err) => {
    next(err);
  })
});



module.exports = router;
