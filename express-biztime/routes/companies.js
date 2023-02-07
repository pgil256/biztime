const express = require('express')
const ExpressError = require('../expressError');
const db = require('../db');
const slugify = require('slugify');

let router = new express.Router();

router.get('/', async function (req, res, next) {
    try {
        const res = await db.query(
            `SELECT code, name
            FROM companies
            ORDER BY name`
        );

        return res.json({'companies': results.rows});
    }

    catch(err) {
        return next(err);
    }
});

router.get('/:code', async function (req, res, next) {
    try {
        let code = req.params.code;
    
        const compRes = await db.query(
            `SELECT code, name, description
            FROM companies
            WHERE code = $1`,
            [code]
        );

         const invRes = await db.query(
            `SELECT id 
            FROM invoices
            WHERE comp_code = $1`,
            [code]
    );

    if (compRes.rows.length === 0) {
        throw new ExpressError(`Invalid company input: ${code}`, 404)
    }

    const company = compRes.rows[0];
    const invoices = invRes.rows;

    for (invoice in invoices) {
        company.invoices = invoice.id
    }

        return res.json({'company': company});
    }

    catch(err) {
        return next(err);
    }
});

router.post('/', async function (req, res, next) {
    try {
        let {name, description} = req.body;
        let code = slugify(name, {lower: true}});
        
        const result = await db.query(
            `INSERT INTO companies( code, name, description)
            VALUES ($1, $2, $3)
            RETURNING code, name, description`,
            [code, name, description]);

        return res.status(201).json({'company': result.rows[0]});
    }
    
    catch(err) {
        return next(err);
        }
});

router.put('/:code', async function (req, res, next) {
  try {
    let {name, description} = req.body;
    let code = req.params.code;

    const result = await db.query(
        `UPDATE companies
        SET name=$1, description=$2
        WHERE code=$3
        RETURNING code, name,description`,
        [name, desciption, code]);
    
    if(result.rows.length === 0) {
        throw new ExpressError(`Company with code ${code} does not exist`, 404)
    } else {
        return res.json({"company": result.rows[0]});
    }
  }
  
  catch(err) {
    return next(err);
  }

});

router.delete('/:code', async function(req, res, next) {
    try{
        let code = req.params.code;

        const result = await db.query(
            `DELETE FROM companies
            WHERE code = $1
            RETURNING code`,
            [code]);
        
        if (result.rows.length === 0) {
            throw new ExpressError(`Company with code ${code} does not exist`)
        } else {
            return res.json({'status': 'deleted'});
        }
    }

    catch (err) {
        return next(err);
    }
})

module.exports = router;
