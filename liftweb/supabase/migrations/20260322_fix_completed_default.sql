-- Fix: strength_sets.completed default was true, should be false.
-- Sets should start unchecked when beginning a new workout.
alter table strength_sets alter column completed set default false;
