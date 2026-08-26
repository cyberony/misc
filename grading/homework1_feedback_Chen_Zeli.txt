FOPC failed (exit 1):

Traceback (most recent call last):
  File "homework_fopc.py", line 262, in <module>
    main()
  File "homework_fopc.py", line 215, in main
    print(f"Loaded {len(data)} records\n")
TypeError: object of type 'NoneType' has no len()

Points lost (FOPC 0/7). The script does not run, so all FOPC points are lost; breakdown by what the grader checks:
- Load/encode (Loaded, 626 records): 1 pt — lost (crash before this)
- Major producers: 1 pt — lost
- High price: 1 pt — lost
- Production for state: 1 pt — lost
- Valid production: 1 pt — lost
- CA production value: 0.5 pt — lost

Total FOPC: 0/7. Tables: 8/8. Total: 8/15.

Unimplemented: load_honey_data(), encode_facts_to_pydatalog(), encode_high_price_rule(), encode_production_constraint_rule(), query_high_price_states(), query_major_producers_with_high_price(), query_production_for_state().
Implemented: encode_major_producer_rule(), query_major_producers().
