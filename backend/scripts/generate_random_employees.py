"""

Add more random employee records (default: 50).



Main seed already creates 100 random employees (SEED_RANDOM_EMPLOYEE_COUNT). Use this to add extra rows on an existing DB.



Usage:

  cd backend

  python scripts/generate_random_employees.py

  python scripts/generate_random_employees.py --count 25 --seed 42

"""

import argparse

import random

import sys

from pathlib import Path



sys.path.insert(0, str(Path(__file__).resolve().parent.parent))



from app.db.database import SessionLocal

from app.models.employee import Department, Designation

from app.seeds.random_employees import add_random_employees





def main() -> None:

    parser = argparse.ArgumentParser(description="Insert extra random employees into the database.")

    parser.add_argument("--count", type=int, default=50, help="Number of employees to create (default: 50)")

    parser.add_argument("--seed", type=int, default=None, help="Random seed for reproducible data")

    args = parser.parse_args()

    if args.count < 1:

        print("count must be >= 1")

        sys.exit(1)



    rng = random.Random(args.seed)



    db = SessionLocal()

    try:

        if not db.query(Department).first() or not db.query(Designation).first():

            print("No departments or designations found. Run scripts/seed_data.py on an empty DB first.")

            sys.exit(1)



        created = add_random_employees(db, count=args.count, rng=rng)

        db.commit()

        print(f"Successfully created {created} random employees (codes GEN***** @ demo.generated).")

        print("They have no login accounts (user_id=null). Add users in Admin if needed.")



    except Exception as e:

        db.rollback()

        print(f"Error: {e}")

        sys.exit(1)

    finally:

        db.close()





if __name__ == "__main__":

    main()


