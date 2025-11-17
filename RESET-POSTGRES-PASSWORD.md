# Reset PostgreSQL Password - Final Solution

## The Problem
PostgreSQL password is unknown and we can't connect.

## The Solution (5 minutes)

### Step 1: Edit pg_hba.conf

1. Open **Notepad as Administrator**
   - Right-click Notepad → Run as Administrator

2. Open file:
   ```
   C:\Program Files\PostgreSQL\17\data\pg_hba.conf
   ```

3. Find these lines (around line 80-90):
   ```
   host    all             all             127.0.0.1/32            scram-sha-256
   host    all             all             ::1/128                 scram-sha-256
   ```

4. Change `scram-sha-256` to `trust`:
   ```
   host    all             all             127.0.0.1/32            trust
   host    all             all             ::1/128                 trust
   ```

5. **Save the file**

### Step 2: Restart PostgreSQL

Open **Command Prompt as Administrator**:

```cmd
net stop postgresql-x64-17
net start postgresql-x64-17
```

### Step 3: Connect and Set Password

```cmd
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres
```

Now you're in! Run:

```sql
ALTER USER postgres WITH PASSWORD 'postgres';
\q
```

### Step 4: Restore pg_hba.conf

1. Open Notepad as Administrator again
2. Open `pg_hba.conf`
3. Change `trust` back to `scram-sha-256`
4. Save

### Step 5: Restart PostgreSQL Again

```cmd
net stop postgresql-x64-17
net start postgresql-x64-17
```

### Step 6: Create Database

```cmd
set PGPASSWORD=postgres
"C:\Program Files\PostgreSQL\17\bin\createdb.exe" -U postgres heritage
```

### Step 7: Start Backend

```bash
cd backend
npm run start:dev
```

**Done!** Backend will connect successfully! 🎉

---

## Quick Reference

**Password is now:** `postgres`

**Connection details:**
- Host: localhost
- Port: 5432
- User: postgres
- Password: postgres
- Database: heritage

These are already in `backend/.env`!
