const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const BadReqError = require('../errors/bad-req-err');
const NotFoundError = require('../errors/not-found-err');
const NotAuthError = require('../errors/not-auth-err');

const { NODE_ENV, JWT_SECRET } = process.env;

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

const createUser = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new BadReqError('Не указан Email или пароль');
  }
  User.findOne({ email })
    .then((user) => {
      if (user) {
        res.status(409).send({ message: 'Такой пользователь уже зарегистрирован.' });
      }
    });
  bcrypt
    .hash(req.body.password, 10)
    .then((hash) => User.create({
      email: req.body.email,
      password: hash,
      name: req.body.name,
    })
      .then((user) => {
        res.status(200).send({
          _id: user._id,
          name: user.name,
          email: user.email,
        });
      })
      .catch((err) => {
        if (err.name === 'ValidationError') {
          throw new BadReqError('Ошибка при создании пользователя');
        } else next(err);
      }))
    .catch((err) => {
      if (err.name === 'ValidationError') {
        throw new BadReqError('Некорректные данные');
      } else next(err);
    });
};

const login = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new NotFoundError('Указанные данные не найдены');
  } else {
    User.findOne({ email }).select('+password')
      .orFail(() => {
        throw new NotAuthError('указан неправильный email или пароль');
      })
      .then((user) => {
        bcrypt.compare(password, user.password)
          .then((matched) => {
            if (!matched) {
              throw new NotAuthError('указан неправильный email или пароль');
            } else {
              const token = jwt.sign({ _id: user._id }, NODE_ENV === 'production' ? JWT_SECRET : 'dev-secret', { expiresIn: '7d' });
              res.send({ token });
            }
          })
          .catch((err) => next(err));
      })
      .catch(next);
  }
};

module.exports = {
  getProfile, updateProfile, createUser, login,
};
