"use strict";

const {fail} = require('./fail')

test('fail works:', () => {
    expect(() => {
        fail();
    }).toThrow(Error);
})