const db = require('../db.js'); 
const ExpressError = require('../expressError');

const express = require('express'); 
const router = new express.Router(); 


router.get('/', async (req, res, next)=>{
    console.error('here');
    try {
        const results = await db.query('SELECT id, comp_code FROM invoices'); 
        return res.json({invoices: results.rows});
    }
    catch{
        return next(err);
    }
});


router.get('/:id', async (req, res, next)=>{
    const id = +(req.params.id); 
    try {
        let invoice = await db.query('SELECT id, comp_code, amt, paid, add_date, paid_date FROM invoices WHERE id=$1', [id]);
        invoice = invoice.rows[0]; 
        const comp_code = invoice.comp_code; 
        delete invoice.comp_code; 

        let company = await db.query('SELECT code, name, description FROM companies WHERE code=$1', [comp_code]);
        company = company.rows[0];

        return res.json({invoice:  {...invoice, company}}); 
    }
    catch{
        return next(new ExpressError("Invoice Not Found", 404));
    } 
});


router.post('/', async (req, res, next)=>{
    const comp_code = req.body.comp_code; 
    const amt = req.body.amt; 
    try{
        const results = await db.query('INSERT INTO invoices(comp_code, amt) VALUES($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date',
         [comp_code, amt]);
        const row = results.rows[0]; 
        return res.status(201).json({invoice: { ...row }}); 
    }
    catch(err){
        return next(err);
    }

});


router.put('/:id', async (req, res, next)=>{
    const id = req.params.id; 
    const amt = req.body.amt; 
    const paid = req.body.paid;

    let paid_status = null;
    try {
        paid_status = await db.query('SELECT paid FROM invoices WHERE id=$1', [id]); 
        paid_status = paid_status.rows[0].paid;
    }
    catch{
        throw new ExpressError('Invoice Not Found', 404);
    }

    let query = ''; 
    let args = null;
    if(paid === paid_status){
        query = 'UPDATE invoices SET amt=$1 WHERE id=$2 RETURNING id, comp_code, amt, paid, add_date, paid_date'; 
        args = [amt, id]; 
    } 
    else {
        let dt = null; 
        if(paid){
            dt = new Date(); 
        }
        query = 'UPDATE invoices SET amt=$1, paid=$2, paid_date=$3 WHERE id=$4 RETURNING id, comp_code, amt, paid, add_date, paid_date'; 
        args = [amt, paid, dt, id];
    }


    try {
        const results = await db.query(query, args);
        if(results.rows.length === 0){
            throw new ExpressError("Invoice Not Found", 404);
        } 
       
        const row = results.rows[0];
        return res.json({invoice : {...row}}); 
    }
    catch(err) {
        return next(err);

    }
});


router.delete('/:id', async (req, res, next)=>{
    const id = +(req.params.id); 

    try {
        const results = await db.query('DELETE FROM invoices WHERE id=$1 RETURNING id',[id]);
        if(results.rows.length === 0){
            throw new ExpressError("Invoice Not Found", 404);
        } 
        return res.json({status: 'deleted'});
    }
    catch(err){
        return next(err);
    }
});

module.exports = router;