<!-- ## Database Table Schema -->

## Student Information
KHAIRI RAHIMI KHYRIL NORRAHIM
2024273124
CDCS2703B
SIR MUHAMMAD ATIF RAMLAN

## Project Background
This project is a real-time messaging platform built as part of the Individual Lab Assignment. It demonstrates the integration of a modern frontend framework (Angular 17) with a cloud-based backend (Supabase). The app features Google Authentication, a real-time PostgreSQL database, and a responsive chat UI.

## Discussion & Learning Outcomes

### I. Challenges Faced
During development, I encountered several hurdles:
1. **OAuth Configuration:** Fixing "Redirect URI Mismatches" by syncing Google Cloud and Supabase settings.
2. **Environment Security:** Managing API keys in `environment.ts` and learning why they must be kept private.
3. **Template Binding:** Moving from hardcoded "Sharon Doe" placeholder text to dynamic data using Angular's `@for` loop and interpolation.

### II. What I Learned
* **Authentication:** Implementing secure Google Sign-In using Supabase Auth.
* **Angular Signals:** Using reactive state management to update the UI instantly when new messages arrive.
* **Real-time Database:** Subscribing to database changes so messages appear without refreshing.
* **Security:** Using Row Level Security (RLS) policies to protect user data at the database level.


## users table

* id (uuid)
* full_name (text)
* avatar_url (text)

## Creating a users table

```sql
CREATE TABLE public.users (
   id uuid not null references auth.users on delete cascade,
   full_name text NULL,
   avatar_url text NULL,
   primary key (id)
);
```

## Enable Row Level Security

```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
```

## Permit Users Access Their Profile

```sql
CREATE POLICY "Permit Users to Access Their Profile"
  ON public.users
  FOR SELECT
  USING ( auth.uid() = id );
```

## Permit Users to Update Their Profile

```sql
CREATE POLICY "Permit Users to Update Their Profile"
  ON public.users
  FOR UPDATE
  USING ( auth.uid() = id );
```

## Supabase Functions

```sql
CREATE
OR REPLACE FUNCTION public.user_profile() RETURNS TRIGGER AS $$ BEGIN INSERT INTO public.users (id, full_name,avatar_url)
VALUES
  (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name'::TEXT,
    NEW.raw_user_meta_data ->> 'avatar_url'::TEXT,
  );
RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Supabase Trigger

```sql
  CREATE TRIGGER
  create_user_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE
    public.user_profile();
```

## Chat_Messages table (Real Time)

* id (uuid)
* Created At (date)
* text (text)
* editable (boolean)
* sender (uuid)
