/* Offline, hand-curated starter content. Replace or extend lessons here. */
(function (root) {
  const raw = [
    ["everyday", "Everyday Wonders", "Little words, big adventures", "🌈", "#FF8D6A", [
      ["curious", "Eager to learn or know something", "The curious child asked how rainbows form."],
      ["glimpse", "A very quick look", "I caught a glimpse of the colorful bird."],
      ["ordinary", "Common or not unusual", "An ordinary morning became a great adventure."],
      ["delight", "A feeling of great pleasure", "The surprise filled her with delight."],
      ["gather", "To bring things or people together", "We gather around the table for dinner."],
      ["gentle", "Kind, calm, or not rough", "A gentle breeze cooled the garden."],
      ["borrow", "To take something temporarily and return it", "May I borrow your blue pencil?"],
      ["discover", "To find something for the first time", "We discover a hidden path in the park."],
      ["purpose", "The reason something is done", "The purpose of this game is to learn."],
      ["sparkle", "To shine with small flashes of light", "The stars sparkle above the town."]
    ]],
    ["feelings", "Feelings Forest", "Name what is happening inside", "💗", "#FF6C9B", [
      ["confident", "Sure of your abilities", "She felt confident before the presentation."],
      ["anxious", "Worried about what might happen", "He was anxious before his first flight."],
      ["grateful", "Thankful for kindness or help", "I am grateful for your thoughtful gift."],
      ["frustrated", "Upset because something is difficult", "She felt frustrated by the tricky puzzle."],
      ["hopeful", "Believing something good may happen", "The team stayed hopeful after the loss."],
      ["calm", "Peaceful and free from worry", "A few deep breaths helped him feel calm."],
      ["compassion", "Concern for another person's suffering", "Her compassion inspired her to help."],
      ["proud", "Pleased about an achievement", "He was proud of finishing the marathon."],
      ["relieved", "Comforted because worry has ended", "We were relieved when the dog came home."],
      ["resilient", "Able to recover after difficulties", "The resilient flower survived the storm."]
    ]],
    ["learning", "Learning Lagoon", "Smart words for bright minds", "📚", "#6A91FF", [
      ["analyze", "To examine something carefully", "We analyze the clues before deciding."],
      ["summarize", "To express the main points briefly", "Please summarize the chapter in three lines."],
      ["evidence", "Facts that support a belief or claim", "The scientist collected evidence for her idea."],
      ["concept", "An idea or general understanding", "The teacher explained a difficult concept."],
      ["research", "Careful study to discover facts", "Their research explored ocean life."],
      ["interpret", "To explain the meaning of something", "We interpret the poem in different ways."],
      ["observe", "To watch or notice carefully", "Observe how the leaves change in autumn."],
      ["strategy", "A plan for achieving a goal", "Our strategy helped us solve the problem."],
      ["revise", "To improve something by changing it", "I will revise my essay after feedback."],
      ["insight", "A clear and deep understanding", "Her question gave us a fresh insight."]
    ]],
    ["nature", "Nature Trail", "Explore our extraordinary planet", "🌿", "#31B896", [
      ["habitat", "The natural home of an animal or plant", "A coral reef is a habitat for many fish."],
      ["canopy", "The upper layer of branches in a forest", "Sunlight filtered through the canopy."],
      ["erosion", "The gradual wearing away of land", "Waves cause erosion along the coast."],
      ["ecosystem", "Living things interacting with their surroundings", "A pond is a small ecosystem."],
      ["bloom", "To produce flowers", "The cherry trees bloom in spring."],
      ["migrate", "To move seasonally to another place", "Some birds migrate thousands of miles."],
      ["shelter", "A place that protects from danger or weather", "The cave gave the hikers shelter."],
      ["drought", "A long period with little rainfall", "The drought left the river nearly dry."],
      ["terrain", "The physical features of an area of land", "The rocky terrain slowed the hikers."],
      ["conserve", "To protect something from waste or loss", "We conserve water by fixing leaks."]
    ]],
    ["science", "Science Station", "Experiment with amazing ideas", "🔬", "#38B9C9", [
      ["hypothesis", "An idea that can be tested", "Her hypothesis predicted faster plant growth."],
      ["variable", "A factor that can change", "Temperature was the variable in the experiment."],
      ["molecule", "A group of atoms bonded together", "A water molecule contains three atoms."],
      ["gravity", "The force that attracts objects toward each other", "Gravity keeps our feet on the ground."],
      ["friction", "Resistance when surfaces move against each other", "Friction helps bicycle brakes work."],
      ["density", "How much mass fits in a given volume", "Oil floats because it has lower density than water."],
      ["reaction", "A change caused by interacting substances", "The chemical reaction produced bubbles."],
      ["energy", "The ability to cause change or do work", "The battery stores energy for the lamp."],
      ["microscope", "An instrument for seeing tiny objects", "We used a microscope to view cells."],
      ["experiment", "A test carried out to learn something", "The experiment tested which seed grew fastest."]
    ]],
    ["space", "Cosmic Quest", "Launch beyond the atmosphere", "🚀", "#8E73F8", [
      ["orbit", "The curved path around an object in space", "The moon travels in an orbit around Earth."],
      ["galaxy", "A huge system of stars, gas, and dust", "Our solar system belongs to the Milky Way galaxy."],
      ["comet", "An icy body that may form a glowing tail", "The comet appeared bright in the night sky."],
      ["asteroid", "A small rocky object orbiting the sun", "The spacecraft flew past an asteroid."],
      ["eclipse", "When one celestial body blocks another's light", "We watched the solar eclipse safely."],
      ["astronaut", "A person trained to travel in space", "The astronaut floated inside the station."],
      ["telescope", "An instrument for viewing distant objects", "A telescope revealed Jupiter's moons."],
      ["launch", "To send something into motion or flight", "The rocket will launch at sunrise."],
      ["crater", "A bowl-shaped hole on a surface", "An impact formed the crater on the moon."],
      ["universe", "All of space and everything in it", "Scientists study the history of the universe."]
    ]],
    ["technology", "Tech City", "Navigate the digital world", "💻", "#5B8AF5", [
      ["algorithm", "A set of steps for solving a problem", "The algorithm sorted the list of names."],
      ["interface", "The part of a system people interact with", "The app has a friendly interface."],
      ["device", "A piece of equipment made for a purpose", "A tablet is a useful learning device."],
      ["network", "Connected devices that exchange information", "Our office network connects every computer."],
      ["privacy", "Control over personal information", "Strong settings can protect online privacy."],
      ["encrypt", "To change data into a protected form", "The service can encrypt private messages."],
      ["update", "A newer or improved version", "The update fixed several small bugs."],
      ["prototype", "An early model used for testing", "The designer built a prototype of the app."],
      ["automation", "Using technology to perform tasks automatically", "Automation saved the team several hours."],
      ["digital", "Using electronic technology or data", "We created a digital map of the city."]
    ]],
    ["art", "Creative Carnival", "Paint ideas with powerful words", "🎨", "#F3A43E", [
      ["palette", "A range of colors or a board for mixing paint", "The artist chose a bright color palette."],
      ["sketch", "A quick, simple drawing", "She made a sketch of the mountain."],
      ["texture", "How a surface looks or feels", "The painting has a rough texture."],
      ["contrast", "A noticeable difference between things", "The contrast makes the white letters stand out."],
      ["imagine", "To form an idea or picture in your mind", "Imagine a city floating in the clouds."],
      ["inspire", "To fill someone with creative motivation", "The music can inspire new stories."],
      ["compose", "To create music, writing, or art", "He plans to compose a short melody."],
      ["vivid", "Very bright, strong, or clear", "Her story was full of vivid details."],
      ["original", "New and not copied from something else", "The student had an original idea."],
      ["masterpiece", "A work of outstanding skill", "The mural became the artist's masterpiece."]
    ]],
    ["food", "Flavor Festival", "Taste a world of expressions", "🍓", "#F17D5F", [
      ["aroma", "A pleasant or noticeable smell", "The aroma of fresh bread filled the kitchen."],
      ["savory", "Salty or spicy rather than sweet", "We shared a savory vegetable pie."],
      ["ingredient", "One food used to make a dish", "Lemon is the secret ingredient in this sauce."],
      ["simmer", "To cook gently just below boiling", "Let the soup simmer for twenty minutes."],
      ["crisp", "Firm and making a sharp sound when bitten", "The apple was sweet and crisp."],
      ["nourish", "To provide what is needed for health and growth", "Good meals nourish our bodies."],
      ["portion", "An amount of food served to one person", "She ordered a small portion of rice."],
      ["recipe", "Instructions for preparing a dish", "We followed the recipe step by step."],
      ["blend", "To mix things smoothly together", "Blend the fruit with yogurt."],
      ["flavor", "The taste of food or drink", "Mint adds a fresh flavor to the tea."]
    ]],
    ["travel", "Adventure Atlas", "Words to take you anywhere", "🧭", "#36BBA5", [
      ["itinerary", "A plan of places and activities for a trip", "Our itinerary includes two museums."],
      ["destination", "The place someone is going to", "The island was our final destination."],
      ["landmark", "A well-known building or feature", "The tower is a famous city landmark."],
      ["explore", "To travel around and discover a place", "We explore the old town on foot."],
      ["journey", "An act of traveling from one place to another", "The train journey lasted three hours."],
      ["navigate", "To find your way along a route", "The map helped us navigate the streets."],
      ["souvenir", "An object kept as a reminder of a trip", "He bought a souvenir at the market."],
      ["scenic", "Having beautiful natural views", "We took the scenic road through the mountains."],
      ["departure", "The act or time of leaving", "Our departure is scheduled for noon."],
      ["accommodate", "To provide space or lodging", "The hotel can accommodate large families."]
    ]],
    ["society", "People Planet", "Connect with the world around you", "🤝", "#D76CB4", [
      ["community", "People connected by place or interests", "Our community organized a clean-up day."],
      ["culture", "Shared customs, arts, and ways of life", "Food is an important part of culture."],
      ["diversity", "The presence of many different kinds", "The festival celebrated cultural diversity."],
      ["cooperate", "To work together toward a goal", "The students cooperate on the project."],
      ["respect", "Consideration for others and their rights", "We show respect by listening carefully."],
      ["volunteer", "To offer help without being paid", "Many residents volunteer at the shelter."],
      ["tradition", "A custom passed down over time", "Baking bread together is a family tradition."],
      ["equality", "The state of having equal rights or value", "The club promotes equality for everyone."],
      ["dialogue", "A conversation or exchange of ideas", "Open dialogue helped solve the disagreement."],
      ["citizen", "A recognized member of a country", "Every citizen can help their neighborhood."]
    ]],
    ["business", "Idea Factory", "Make your next big plan", "💼", "#E6A03F", [
      ["budget", "A plan for spending available money", "We created a budget for the event."],
      ["invest", "To use resources expecting future benefit", "The company plans to invest in training."],
      ["customer", "A person who buys goods or services", "The store thanked each customer."],
      ["profit", "Money left after expenses are paid", "The bakery made a small profit."],
      ["negotiate", "To discuss terms in order to agree", "They negotiate a fair price for the work."],
      ["proposal", "A plan offered for consideration", "The team presented a new proposal."],
      ["efficient", "Achieving results with little waste", "The new process is more efficient."],
      ["resource", "Something useful for achieving a goal", "Time is a valuable resource."],
      ["deadline", "The latest time something must be finished", "The project deadline is next Friday."],
      ["collaborate", "To work together on a shared task", "The artists collaborate on a new design."]
    ]],
    ["verbs", "Action Arena", "Bring every sentence to life", "⚡", "#7D70F3", [
      ["adapt", "To change to suit new conditions", "Animals adapt to their environments."],
      ["achieve", "To succeed in reaching a goal", "You can achieve a lot with steady practice."],
      ["anticipate", "To expect something before it happens", "We anticipate heavy traffic this evening."],
      ["clarify", "To make something easier to understand", "Can you clarify the final instruction?"],
      ["enhance", "To improve quality or value", "Music can enhance the atmosphere."],
      ["evaluate", "To judge quality or importance", "We evaluate the results after each test."],
      ["illustrate", "To explain using examples or pictures", "The diagram helps illustrate the idea."],
      ["maintain", "To keep something in good condition", "We maintain the garden every weekend."],
      ["persuade", "To convince someone with reasons", "She tried to persuade her friend to join."],
      ["transform", "To change something greatly", "A little paint can transform the room."]
    ]],
    ["descriptive", "Word Wonderland", "Make your descriptions shine", "✨", "#A46CE0", [
      ["ancient", "Very old or from a distant past", "They explored an ancient stone bridge."],
      ["brilliant", "Very bright or exceptionally clever", "She suggested a brilliant solution."],
      ["delicate", "Easily damaged or requiring gentle care", "The delicate flower opened at dawn."],
      ["enormous", "Extremely large", "An enormous whale swam beside the boat."],
      ["fierce", "Strong, intense, or aggressive", "A fierce wind shook the trees."],
      ["fragile", "Easy to break or damage", "The glass sculpture is very fragile."],
      ["mysterious", "Difficult to explain or understand", "A mysterious light appeared in the forest."],
      ["radiant", "Shining brightly or showing joy", "Her radiant smile lit up the room."],
      ["serene", "Calm, peaceful, and untroubled", "The lake looked serene at sunrise."],
      ["vibrant", "Full of energy and bright color", "The market was lively and vibrant."]
    ]],
    ["advanced", "Mastery Mountain", "Reach for extraordinary language", "🏔️", "#5379D4", [
      ["ambiguous", "Having more than one possible meaning", "The ambiguous message confused the group."],
      ["coherent", "Clear, logical, and well organized", "Her explanation was coherent and concise."],
      ["diligent", "Showing careful, steady effort", "The diligent researcher checked every source."],
      ["eloquent", "Fluent and persuasive in speech or writing", "He gave an eloquent speech about education."],
      ["feasible", "Possible and practical to do", "The team chose a feasible plan."],
      ["meticulous", "Extremely careful about details", "The editor made meticulous corrections."],
      ["nuance", "A subtle difference in meaning or feeling", "The translation missed an important nuance."],
      ["pragmatic", "Focused on practical solutions", "They took a pragmatic approach to the problem."],
      ["substantial", "Large or important in amount", "The changes led to substantial improvement."],
      ["versatile", "Able to serve many uses or roles", "This versatile tool works in several ways."]
    ]]
  ];

  const lessons = raw.map(([id, title, subtitle, emoji, color, entries], index) => ({
    id, title, subtitle, emoji, color, order: index,
    words: entries.map(([term, meaning, example]) => ({
      id: `${id}:${term.toLowerCase()}`, term, meaning, example, lessonId: id
    }))
  }));
  root.VQ_LESSONS = lessons;
  if (typeof module !== "undefined" && module.exports) module.exports = lessons;
})(typeof window !== "undefined" ? window : globalThis);
