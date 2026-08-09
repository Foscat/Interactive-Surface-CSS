export async function withFixtureCleanup(fixture, run) {
  let bodyResult;
  let bodyError;

  try {
    bodyResult = await run(fixture);
  } catch (error) {
    bodyError = error;
  }

  let cleanupError;
  try {
    fixture.cleanup();
  } catch (error) {
    cleanupError = error;
  }

  // Preserve the primary assertion failure while retaining teardown diagnostics.
  if (bodyError && cleanupError) {
    throw new AggregateError(
      [bodyError, cleanupError],
      "The test body and packed fixture cleanup both failed.",
    );
  }
  if (bodyError) throw bodyError;
  if (cleanupError) throw cleanupError;

  return bodyResult;
}
