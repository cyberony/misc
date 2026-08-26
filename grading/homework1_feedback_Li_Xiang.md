FOPC failed (exit 1):

Traceback (most recent call last):
  File "homework_fopc.py", line 323, in <module>
    main()
  File "homework_fopc.py", line 287, in main
    encode_production_constraint_rule()
  File "homework_fopc.py", line 173, in encode_production_constraint_rule
    & (abs(Total - (C * Yld)) < 1)
TypeError: bad operand type for abs(): 'Operation'

Points lost (FOPC 0/7). The script crashes in encode_production_constraint_rule(), so all FOPC points are lost; breakdown by what the grader checks:
- Load/encode (Loaded, 626 records): 1 pt — lost
- Major producers: 1 pt — lost
- High price: 1 pt — lost
- Production for state: 1 pt — lost
- Valid production: 1 pt — lost
- CA production value: 0.5 pt — lost

Total FOPC: 0/7. Tables: 8/8. Total: 8/15.
