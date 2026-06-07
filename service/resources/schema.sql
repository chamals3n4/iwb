DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.city_ratings CASCADE;
DROP TABLE IF EXISTS public.city_chat CASCADE;
DROP TABLE IF EXISTS public.incidents CASCADE;
DROP TABLE IF EXISTS public.places CASCADE;
DROP TABLE IF EXISTS public.meetups CASCADE;
DROP TABLE IF EXISTS public.cities CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

DROP SEQUENCE IF EXISTS chat_messages_id_seq;
DROP SEQUENCE IF EXISTS cities_id_seq;
DROP SEQUENCE IF EXISTS city_chat_id_seq;
DROP SEQUENCE IF EXISTS city_ratings_id_seq;
DROP SEQUENCE IF EXISTS meetups_id_seq;

CREATE SEQUENCE chat_messages_id_seq START 1;
CREATE SEQUENCE cities_id_seq START 1;
CREATE SEQUENCE city_chat_id_seq START 1;
CREATE SEQUENCE city_ratings_id_seq START 1;
CREATE SEQUENCE meetups_id_seq START 1;

CREATE TABLE users (
  user_id character varying NOT NULL,
  username character varying NOT NULL UNIQUE,
  first_name character varying NOT NULL,
  last_name character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  country character varying,
  mobile_number character varying,
  birthdate character varying,
  bio text,
  created_at character varying,
  updated_at character varying,
  CONSTRAINT users_pkey PRIMARY KEY (user_id)
);

CREATE TABLE cities (
  id integer NOT NULL DEFAULT nextval('cities_id_seq'::regclass),
  city_id character varying NOT NULL UNIQUE,
  name character varying NOT NULL,
  slug character varying NOT NULL UNIQUE,
  province character varying NOT NULL,
  description text NOT NULL,
  category character varying NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  cost_of_living integer,
  temperature integer,
  population integer,
  amenities text,
  image_urls text,
  overall_rating numeric DEFAULT 0.0,
  total_ratings integer DEFAULT 0,
  rank_position integer DEFAULT 0,
  created_at text DEFAULT (CURRENT_TIMESTAMP)::text,
  updated_at text DEFAULT (CURRENT_TIMESTAMP)::text,
  CONSTRAINT cities_pkey PRIMARY KEY (id)
);

CREATE TABLE meetups (
  id integer NOT NULL DEFAULT nextval('meetups_id_seq'::regclass),
  event_id character varying NOT NULL UNIQUE,
  event_name character varying NOT NULL,
  event_description text NOT NULL,
  event_start_date character varying NOT NULL,
  event_start_time character varying NOT NULL,
  event_end_date character varying NOT NULL,
  event_end_time character varying NOT NULL,
  venue_name character varying NOT NULL,
  venue_google_maps_url text NOT NULL,
  is_paid_event boolean DEFAULT false,
  event_cost numeric,
  has_limited_capacity boolean DEFAULT false,
  event_capacity integer,
  require_approval boolean DEFAULT false,
  image_url text,
  created_at character varying NOT NULL,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT meetups_pkey PRIMARY KEY (id)
);

CREATE TABLE places (
  place_id character varying NOT NULL,
  name character varying NOT NULL,
  location character varying NOT NULL,
  google_maps_url text NOT NULL,
  price numeric NOT NULL,
  currency character varying NOT NULL,
  billing character varying NOT NULL,
  capacity character varying NOT NULL,
  workspace_types text,
  amenities text,
  phone character varying NOT NULL,
  email character varying NOT NULL,
  website character varying NOT NULL,
  photo_urls text,
  created_at character varying NOT NULL,
  CONSTRAINT places_pkey PRIMARY KEY (place_id)
);

CREATE TABLE incidents (
  incident_id character varying NOT NULL,
  user_id character varying NOT NULL,
  incident_type character varying NOT NULL,
  description text NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  reported_at timestamp without time zone NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT incidents_pkey PRIMARY KEY (incident_id),
  CONSTRAINT fk_incidents_user_id FOREIGN KEY (user_id) REFERENCES users(user_id)
);

CREATE TABLE city_chat (
  id integer NOT NULL DEFAULT nextval('city_chat_id_seq'::regclass),
  message_id character varying NOT NULL UNIQUE,
  city_id character varying NOT NULL,
  user_id character varying NOT NULL,
  user_name character varying NOT NULL,
  message text NOT NULL,
  created_at text DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT city_chat_pkey PRIMARY KEY (id),
  CONSTRAINT city_chat_city_id_fkey FOREIGN KEY (city_id) REFERENCES cities(city_id)
);

CREATE TABLE city_ratings (
  id integer NOT NULL DEFAULT nextval('city_ratings_id_seq'::regclass),
  rating_id character varying NOT NULL UNIQUE,
  city_id character varying NOT NULL,
  user_id character varying NOT NULL,
  cost_of_living_rating integer CHECK (cost_of_living_rating >= 1 AND cost_of_living_rating <= 5),
  safety_rating integer CHECK (safety_rating >= 1 AND safety_rating <= 5),
  transportation_rating integer CHECK (transportation_rating >= 1 AND transportation_rating <= 5),
  healthcare_rating integer CHECK (healthcare_rating >= 1 AND healthcare_rating <= 5),
  food_rating integer CHECK (food_rating >= 1 AND food_rating <= 5),
  nightlife_rating integer CHECK (nightlife_rating >= 1 AND nightlife_rating <= 5),
  culture_rating integer CHECK (culture_rating >= 1 AND culture_rating <= 5),
  outdoor_activities_rating integer CHECK (outdoor_activities_rating >= 1 AND outdoor_activities_rating <= 5),
  review_text text,
  created_at text DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT city_ratings_pkey PRIMARY KEY (id),
  CONSTRAINT city_ratings_city_id_fkey FOREIGN KEY (city_id) REFERENCES cities(city_id)
);

CREATE TABLE chat_messages (
  id integer NOT NULL DEFAULT nextval('chat_messages_id_seq'::regclass),
  message_id character varying NOT NULL UNIQUE,
  meetup_id character varying NOT NULL,
  user_id character varying NOT NULL,
  user_name character varying NOT NULL,
  message text NOT NULL,
  created_at character varying NOT NULL,
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT chat_messages_meetup_id_fkey FOREIGN KEY (meetup_id) REFERENCES meetups(event_id)
);