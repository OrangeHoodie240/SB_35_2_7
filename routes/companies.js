const db = require('../db.js');
const ExpressError = require('../expressError'); 
const slugify = require('slugify');

const express = require('express');
const router = new express.Router();

router.get('/', async (req, res, next)=>{
    try {
        const results = await db.query('SELECT code, name FROM companies');
        return res.json({companies: results.rows}); 
    }
    catch (err){
        return next(err);
    }
});


router.get('/:code', async (req, res, next)=>{
    const code = req.params.code;
    try {
        let companyResults =  db.query(`SELECT code, name, description FROM companies WHERE code=$1`, [code]); 
        let invoiceResults =  db.query('SELECT id FROM invoices WHERE comp_code=$1', [code]);
        [companyResults, invoiceResults] = await Promise.all([companyResults, invoiceResults]); 
        const comp = companyResults.rows[0];
        let invoices = invoiceResults.rows;  
        invoices = invoices.map(o => o.id); 

        let industries = await db.query(`SELECT ARRAY_AGG(i.industry)
                                         FROM industries_to_companies m
                                         JOIN industries i 
                                            ON m.ind_code = i.code
                                         WHERE m.comp_code = $1
                                         `, [code]);
        industries = industries.rows[0].array_agg;

        return res.json({company: {...comp, invoices, industries}});
    }
    catch {
            return next((new ExpressError(`Company with code ${code} does not exist`, 404)));
    }
});

router.post('/', async (req, res, next) => {
    const name = req.body.name; 
    const description = req.body.description;
    const code = slugify(name);  
    try {
        const results = await db.query('INSERT INTO companies(code, name, description) VALUES($1, $2, $3) RETURNING code, name, description',
         [code, name, description]);
        const row = results.rows[0];
        return res.status(201).json({company: {code: row.code, name: row.name, description: row.description}}); 
    }
    catch (err){
        return next(err);
    }
});

router.put('/:code', async (req, res, next)=>{
    const code = req.params.code; 
    const name = req.body.name; 
    const description = req.body.description; 
    try{
        const results = await db.query(`UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description`,
         [name, description, code]); 
        const row = results.rows[0];
        return res.json({company: {name: row.name, description: row.description}});
    }
    catch{
        return next((new ExpressError(`Company with code ${code} does not exist`, 404)));
    }
});


router.delete('/:code', async (req, res, next)=>{
    const code = req.params.code; 
    try {
        const results = await db.query('DELETE FROM companies WHERE code=$1 RETURNING code', [code]);
        if(results.rows.length < 1){
            throw new ExpressError(`Company with code ${code} does not exist`, 404)
        }
        return res.json({'status': 'deleted'});
    }
    catch(err) {
        return next(err);
    }
});

module.exports = router; 