// const bcrypt = require('bcrypt');
const User = require('../models/user');
const BadReqError = require('../errors/bad-req-err');
const NotFoundError = require('../errors/not-found-err');

const getProfile = (req, res, next) => {
  User.findById(req.user._id)
    .orFail(() => {
      throw new NotFoundError('Пользователь с указанным id не найден');
    })
    .then((users) => {
      res.status(200).send(users);
    })
    .catch(next);
};

const updateProfile = (req, res, next) => {
  const { email, name } = req.body;
  User.findByIdAndUpdate(req.user._id, { email, name }, { new: true, runValidators: true })
    .orFail(() => {
      throw new NotFoundError('Пользователь с указанным id не найден');
    })
    .then((user) => {
      res.status(200).send(user);
    })
    .catch((err) => {
      if (err.name === 'CastError' || err.name === 'ValidationError') {
        throw new BadReqError('Данные некорректны');
      }
    })
    .catch(next);
};

module.exports = {
  getProfile, updateProfile,
};
