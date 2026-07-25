export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  try {
    const { assertProductionStoryRecipeRuntime } = await import(
      "./lib/story-recipe-runtime"
    );
    const runtime = assertProductionStoryRecipeRuntime();
    console.info(
      `[onward:recipe-ready] recipe=${runtime.recipe.recipeId} manifest=${runtime.recipe.manifestSha256} deployment=${runtime.deploymentVersion}`,
    );
  } catch {
    // Do not throw globally: `/api/match` must still be able to return reviewed
    // crisis resources. The route fails closed for every non-crisis story, and
    // the deployment checker turns this fixed startup signal into a hard gate.
    console.error("[onward:recipe-invalid] code=runtime_configuration_invalid");
  }
}
