SELECT * FROM "AIReport" WHERE "generatedBy" NOT IN (SELECT id FROM "User");
