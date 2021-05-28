const express = require('express'); 
const router = new express.Router(); 
const db = require('../db'); 

const ExpressError = require('../expressError'); 


router.get('/', async (req, res, next)=>{
    try { 
        let results = await db.query(`SELECT industry, code FROM industries`);
        
        results = results.rows; 
        if(results.length === 0){
            throw new ExpressError('No industries!', 400); 
        }

        return res.json(results); 
    }
    catch(err) {
        return next(err); 
    }
});

router.post('/', async (req, res, next)=>{
    const code = req.body.code; 
    const industry = req.body.industry; 
    try {
        let results = await db.query(`INSERT INTO industries(code, industry)
                                      VALUES($1, $2)
                                      RETURNING code, industry`, [code, industry]);
        if(results.rows.length === 0){
            throw new ExpressError("Failed to create industry", 500); 
        }
        results = results.rows[0]; 
        return res.status(201).json(results); 
    }
    catch(err){
        return next(err);
    }
});

router.post('/companies', async (req, res, next)=>{
    const ind_code = req.body.ind_code; 
    const comp_code = req.body.comp_code; 
    
    try {
        let results = await db.query(`INSERT INTO industries_to_companies(comp_code, ind_code)
                                VALUES($1, $2)
                                RETURNING comp_code, ind_code`, [comp_code, ind_code]);
        results = results.rows[0]; 
        return res.status(201).json(results); 
    }
    catch (err){
        return next(err);
    }
});

module.exports = router; 