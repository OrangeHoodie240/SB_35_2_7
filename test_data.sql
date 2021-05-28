\c test_biztime

DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS companies;
DROP TABLE IF EXISTS industries; 
DROP TABLE IF EXISTS industries_to_companies; 

CREATE TABLE companies (
    code text PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text
);

CREATE TABLE invoices (
    id serial PRIMARY KEY,
    comp_code text NOT NULL REFERENCES companies ON DELETE CASCADE,
    amt float NOT NULL,
    paid boolean DEFAULT false NOT NULL,
    add_date date DEFAULT CURRENT_DATE NOT NULL,
    paid_date date,
    CONSTRAINT invoices_amt_check CHECK ((amt > (0)::double precision))
);

CREATE TABLE industries(
  code TEXT UNIQUE NOT NULL, 
  industry TEXT UNIQUE NOT NULL
);

CREATE TABLE industries_to_companies(
  comp_code TEXT NOT NULL, 
  ind_code TEXT NOT NULL
);
