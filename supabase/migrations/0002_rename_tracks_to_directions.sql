UPDATE "applications"
SET
  "cancellationReason" = REPLACE("cancellationReason", 'трек', 'напрям')
WHERE
  "cancellationReason" LIKE '%трек%';

UPDATE "reports"
SET
  reflection = REPLACE(reflection, 'треку', 'напряму')
WHERE
  reflection LIKE '%треку%';

UPDATE "reports"
SET
  reflection = REPLACE(reflection, 'треком', 'напрямом')
WHERE
  reflection LIKE '%треком%';

UPDATE "reports"
SET
  reflection = REPLACE(reflection, 'треку', 'напряму')
WHERE
  reflection LIKE '%треку%';

UPDATE "reports"
SET
  reflection = REPLACE(reflection, 'трек', 'напрям')
WHERE
  reflection LIKE '%трек%';

UPDATE "reports"
SET
  "skillsGained" = REPLACE("skillsGained", 'трек', 'напрям')
WHERE
  "skillsGained" LIKE '%трек%';

UPDATE "reports"
SET
  "teacherFeedback" = REPLACE("teacherFeedback", 'трек', 'напрям')
WHERE
  "teacherFeedback" LIKE '%трек%';
