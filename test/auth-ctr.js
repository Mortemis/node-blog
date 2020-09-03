const { expect } = require('chai');
const sinon = require('sinon');
const mongoose = require('mongoose');

const User = require('../models/user');
const authCtr = require('../controllers/auth');
const feedCtr = require('../controllers/feed');
const cfg = require('../config.json');

mongoose.set("useNewUrlParser", true);
mongoose.set("useUnifiedTopology", true);
mongoose.set("useFindAndModify", false);

describe('[Auth controller]', () => {
    describe(' > login', () => {
        it('should throw error with code 500 if accessing database fails', (done) => {
            sinon.stub(User, 'findOne');
            User.findOne.throws();
            const req = {
                body: {
                    email: 'test@test.com',
                    password: '12345'
                }
            }
            authCtr.login(req, {}, () => { }).then(result => {
                expect(result).to.be.an('error');
                expect(result).to.be.property('statusCode', 500);
                done();
            });
            User.findOne.restore();
        });
    });

    describe(' > other', () => {

        it('should send a response with a valid user status for an existing user', (done) => {

            mongoose.connect(cfg.MONGO_TEST_URI)
                .then(() => {
                    const user = new User({
                        email: 'test@test.com',
                        password: 'testpwd',
                        name: 'test',
                        posts: [],
                        _id: '5f4fdf8027c124352c8ca940'
                    });
                    return user.save();
                })
                .then(() => {
                    const req = { userId: '5f4fdf8027c124352c8ca940' }
                    const res = {
                        statusCode: 500,
                        userStatus: null,
                        status(code) {
                            this.statusCode = code;
                            return this;
                        },
                        json(data) {
                            this.userStatus = data.status;
                        }
                    };

                    feedCtr.getStatus(req, res, () => { })
                        .then(() => {
                            expect(res.statusCode).to.be.equal(200);
                            expect(res.userStatus).to.be.equal('I am new!');
                            return User.deleteMany({});

                        }).then(() => {
                            mongoose.disconnect().then(() => {
                                done();
                            })
                        });
                });
        })

    });
});