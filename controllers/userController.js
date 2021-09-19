const User = require('../models/userModel');
const UserModel = require('../models/userModel')
// Display list of all Users.
exports.user_list = function (req, res) {
    res.send('NOT IMPLEMENTED: User list');
};

// Display detail page for a specific User.
exports.user_detail = function (req, res) {
    res.send('NOT IMPLEMENTED: User detail: ' + req.params.id);
};

// Display User create form on GET.
exports.user_create_get = function (req, res) {
    const user = new UserModel(req.body)
    user.save().then((result) => {
        res.status(201).send(user);
    }).catch((error) => {
        res.status(400).send(error)
    });
};

// Handle User create on POST.
exports.user_create_post = function (req, res) {
    res.send('NOT IMPLEMENTED: User create POST');
};

// Display User delete form on GET.
exports.user_delete_get = function (req, res) {
    res.send('NOT IMPLEMENTED: User delete GET');
};

// Handle User delete on POST.
exports.user_delete_post = function (req, res) {
    res.send('NOT IMPLEMENTED: User delete POST');
};

// Display User update form on GET.
exports.user_update_get = function (req, res) {
    res.send('NOT IMPLEMENTED: User update GET');
};

// Handle User update on POST.
exports.user_update_post = function (req, res) {
    res.send('NOT IMPLEMENTED: User update POST');
};