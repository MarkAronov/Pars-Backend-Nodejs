var Post = require('../models/post');

exports.index = function (req, res) {
    res.send('NOT IMPLEMENTED: Site Home Page');
};
// Display list of all posts.
exports.post_list = function (req, res) {
    res.send('NOT IMPLEMENTED: Post list');
};

// Display detail page for a specific post.
exports.post_detail = function (req, res) {
    res.send('NOT IMPLEMENTED: Post detail: ' + req.params.id);
};

// Display post create form on GET.
exports.post_create_get = function (req, res) {
    res.send('NOT IMPLEMENTED: Post create GET');
};

// Handle post create on POST.
exports.post_create_post = function (req, res) {
    res.send('NOT IMPLEMENTED: Post create POST');
};

// Display post delete form on GET.
exports.post_delete_get = function (req, res) {
    res.send('NOT IMPLEMENTED: Post delete GET');
};

// Handle post delete on POST.
exports.post_delete_post = function (req, res) {
    res.send('NOT IMPLEMENTED: Post delete POST');
};

// Display post update form on GET.
exports.post_update_get = function (req, res) {
    res.send('NOT IMPLEMENTED: Post update GET');
};

// Handle post update on POST.
exports.post_update_post = function (req, res) {
    res.send('NOT IMPLEMENTED: Post update POST');
};