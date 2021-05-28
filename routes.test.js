const { json } = require('express');
const request = require('supertest'); 

process.env.NODE_ENV='test'; 

const app = require('./app'); 
const db = require('./db'); 


async function clearDb(){
    const q1 = db.query(`DELETE FROM companies`);
    const q2 = db.query(`DELETE FROM invoices`);
    const q3 = db.query(`DELETE FROM industries`);
    const q4 = db.query(`DELETE FROM industries_to_companies`);

    await Promise.all([q1, q2, q3, q4]); 

}

beforeAll(async ()=>{
    await clearDb(); 

    const q1 = db.query(`INSERT INTO companies(name, code, description) 
                         VALUES('test_company', 'test-company', 'company for testing purposes')`); 
    const q2 = db.query(`INSERT INTO industries(code, industry)
                         VALUES('test', 'Testing')`);
    await Promise.all([q1, q2]);
});

afterAll(async ()=>{
    await clearDb(); 
    await db.end();
});

describe('test companies.js', ()=>{
    test('should add company', async ()=>{
            const doge = {
                name: 'Doge Coin', 
                description: 'Such Currency'
            };
            const resp = await request(app).post('/companies').send(doge); 
            expect(resp.statusCode).toEqual(201); 
            
            let results = await db.query(`SELECT name, description FROM companies WHERE name='Doge Coin'`); 
            results = results.rows[0]; 
            expect(results).toEqual(doge)
    });

    test('should get company', async ()=>{
        const resp = await request(app).get('/companies/test-company'); 
        expect(resp.statusCode).toEqual(200); 
        expect(resp.body.company).toEqual({
            name: 'test_company', 
            code: 'test-company', 
            description: 'company for testing purposes', 
            invoices: [], 
            industries: null
        });
    });

    test('should get all companies', async()=>{
        const p1 =  request(app).get('/companies'); 
        const p2 = db.query('SELECT code, name FROM companies'); 
        let [resp, results] = await Promise.all([p1, p2]); 

        expect(resp.statusCode).toEqual(200); 

        results = results.rows; 
        expect(resp.body.companies).toEqual(results); 
    });

});

describe('test industries.js', ()=>{
    test('should add industry', async()=>{
        const industry = {code: 'tech', industry: 'Technology'}; 
        const resp = await request(app).post('/industries').send(industry); 

        expect(resp.statusCode).toEqual(201); 

        let results = await db.query(`SELECT code, industry FROM industries WHERE code='tech'`); 
        results = results.rows[0]; 
        expect(results).toEqual(industry); 
    });

    test('should get all industries', async()=>{
        const p1 =  request(app).get('/industries'); 
        const p2 = db.query('SELECT * FROM industries'); 
        let [resp, results] = await Promise.all([p1, p2]); 

        expect(resp.statusCode).toEqual(200); 

        results = results.rows; 
        expect(resp.body).toEqual(results); 
    });

    test('should add industry to company relationship', async ()=>{
        const body = {ind_code: 'test', comp_code: 'test-company'}; 

        let beforeCount = await db.query('SELECT COUNT(*) FROM industries_to_companies'); 
        beforeCount = beforeCount.rows[0];
        beforeCount = +(beforeCount.count); 

        const resp = await request(app).post('/industries/companies').send(body); 

        expect(resp.statusCode).toEqual(201); 

        let afterCount = await db.query('SELECT COUNT(*) FROM industries_to_companies'); 
        afterCount = afterCount.rows[0];
        afterCount = +(afterCount.count); 

        expect(afterCount).toEqual(beforeCount + 1);
    });
});


describe('test invoices.js', ()=>{
    test('should add invoice', async()=>{
        let beforeCount = await db.query('SELECT COUNT(*) FROM invoices'); 
        beforeCount = beforeCount.rows[0];
        beforeCount = +(beforeCount.count); 

        const body = {comp_code: 'test-company', amt: 3000}; 
        const resp = await request(app).post('/invoices').send(body); 

        expect(resp.statusCode).toEqual(201); 

        let afterCount = await db.query('SELECT COUNT(*) FROM invoices'); 
        afterCount = afterCount.rows[0];
        afterCount = +(afterCount.count); 

        expect(afterCount).toEqual(beforeCount + 1);
    });

});
