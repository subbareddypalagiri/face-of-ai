const { blenderTD } = require('../unin-blender-td');

async function test() {
  console.log('Testing 1: Cyberpunk prompt...');
  const res1 = await blenderTD.generateDirectorInquiry('Rainy Tokyo alley at midnight with neon ramen shop');
  console.log('Genre:', res1.detectedGenre);
  console.log('Questions count:', res1.directorQuestions.length);
  console.log('Q2:', res1.directorQuestions[1].question);
  console.log('Q2 Options:', res1.directorQuestions[1].options);

  console.log('\nTesting 2: Supercar prompt...');
  const res2 = await blenderTD.generateDirectorInquiry('Red Ferrari SF90 on wet coastal highway');
  console.log('Genre:', res2.detectedGenre);
  console.log('Q2:', res2.directorQuestions[1].question);

  console.log('\nTesting 3: Ocean prompt...');
  const res3 = await blenderTD.generateDirectorInquiry('Sunset ocean with luxury yacht and caustics');
  console.log('Genre:', res3.detectedGenre);
  console.log('Q2:', res3.directorQuestions[1].question);
}

test().catch(console.error);
