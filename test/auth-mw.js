const jwt = require('jsonwebtoken');
const sinon = require('sinon');
const { expect } = require('chai');

const auth = require('../middlewares/is-auth');

describe('[Auth middleware]', () => {
    it('should throw error if no auth header is present', () => {
        const req = {
            get() {
                return null;
            }
        };

        expect(auth.bind(this, req, {}, () => { })).to.throw('Not authenticated.');
    });

    it('should throw an error if auth header is only one string', () => {
        const req = {
            get() {
                return 'asdasdd';
            }
        };

        expect(auth.bind(this, req, {}, () => { })).to.throw('jwt must be provided');
    });

    it('should throw an error if token not verified', () => {
        const req = {
            get() {
                return 'Bearer 12312asdas';
            }
        };

        expect(auth.bind(this, req, {}, () => { })).to.throw();
    });

    it('should return a userId after verification', () => {
        const req = {
            get() {
                return 'Bearer 12312asdas';
            }
        };
        sinon.stub(jwt, 'verify')
        jwt.verify.returns({userId: 'abc'});
        auth(req, {}, () => {});
        expect(req).to.have.property('userId');
        expect(req).to.have.property('userId', 'abc');
        expect(jwt.verify.called).to.be.true;
        jwt.verify.restore();
    });
});

