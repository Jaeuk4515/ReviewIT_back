const express = require('express');
const formidable = require('formidable');

const multipartForm = (req, res, next) => {
  const form = formidable({ multiples: true });

  form.parse(req, (err, fields, files) => {
    if (err) {
      next(err);
      return;
    }

    req.body = fields;
    req.files = files;
    next();
  });
};

module.exports = multipartForm;