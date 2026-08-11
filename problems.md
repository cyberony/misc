# Jupyter Notebook

Please check out the following Jupyter Notebook that should help you with guidance through the homework:
experiments/deep-learning-experiments.ipynb


# Coding (5 points)

Your task is to implement neural networks and train them to perform classification on different types of data. You will write the following code:

- A function for training a model on a training dataset for one epoch (in `src/run_model.py`)
- A function for evaluating a trained model on a validation/testing dataset (in `src/run_model.py`)
- A function which trains (over multiple epoch), validates, or tests a model as specified (in `src/run_model.py`)
- Two fully connected neural networks (in `src/models.py`)

You will also have to write code for experiments. Note that the free response questions provide necessary information for writing the code above. Therefore, we recommend you write the code after going through the free response questions and follow the same order in running the experiments. 

Your grade for this section is defined by the autograder. If it says you got an 80/100, you get 4 points here.

You should make a conda environment for this homework just like you did for previous homeworks. We have included a requirements.txt.

# Free-response questions (5 points)

To answer the free-response questions, you will have to write extra code (that is not covered by the test cases). You may include your experiments in new files in the `experiments` directory. See `experiments/example.py` for an example. You can run any experiments you create within this directory with `python -m experiments.<experiment_name>`. For example, `python -m experiments.example` runs the example experiment. You must hand in whatever code you write for experiments by pushing to github (as you did for all previous assignments). 

**NOTE: if we have any doubts about your experiments we reserve the right to check this code to see if your results could have been generated using this code. If we don't believe it, or if there is no code at all, then you may receive a 0 for any free-response answer that would have depended on running code.**


## PyTorch introduction

For this assignment, you will be learning about a popular library for implementing neural networks called PyTorch. It is very popular to train neural networks using a GPU (because they speed up training by a large factor), but for this assignment **you do not need a GPU** as **all of the training will happen on your CPU**. There are other popular libraries for neural networks, such as TensorFlow, but for this assignment you will be using PyTorch.

Here is the official website for PyTorch: [https://pytorch.org/](https://pytorch.org/)

Here is the API documentation: [https://pytorch.org/docs/stable/index.html](https://pytorch.org/docs/stable/index.html)

Here is a cheat sheet of commonly used methods: [https://pytorch.org/tutorials/beginner/ptcheat.html](https://pytorch.org/tutorials/beginner/ptcheat.html)

Here is a comparison of PyTorch and Numpy methods: [https://github.com/wkentaro/pytorch-for-numpy-users](https://github.com/wkentaro/pytorch-for-numpy-users)

To install PyTorch, find the correct install command for your operating system and version of python [here](https://pytorch.org/get-started/locally/). For "PyTorch Build" select the `Stable (1.7)` build, select your operating system, for "Package" select `pip` , for "Language" select your python version (either python 3.5, 3.6, or 3.7), and finally for "CUDA" select `None`. **Make sure to run the command with your conda environment activated.**

_Note: To determine which python you are using, type `python --version` into your command line._


## Understanding PyTorch 

Read the first four tutorials on [this page](https://pytorch.org/tutorials/beginner/deep_learning_60min_blitz.html) ("*What is PyTorch?*", "*Autograd: Automatic Differentiation*", "*Neural Networks*", and "*Training a Classifier*"). 

## Training on MNIST (2 points)

The MNIST dataset of handwritten digits is used for this assignment. You can read more about it [here](https://en.wikipedia.org/wiki/MNIST_database) and download it from the "Files" tab of the class Canvas. You must download all 4 files (the training images, training labels, testing images, and testing labels). Please unzip these files and store the unzipped files in `data/`. Note that these files are not pushed to GitHub, so you will need to repeat this process for each computer that you use to work on this assignment. In general, large files should not be stored in GitHub repositories.

Let us train neural networks to classify handwritten digits from the MNIST dataset and analyze the accuracy and training time of these neural networks. You'll need to put the 

**Build the model architecture:** Create a neural network with two fully connected (aka, dense) hidden layers of size 128, and 64, respectively. Your network should have a total of four layers: an input layer that takes in examples, two hidden layers, and an output layer that outputs a predicted class (10 possible classes, one for each digit class in MNIST). Your hidden layers should have a ReLU activation function.  Your last (output) layer should be a linear layer with one node per class (in this case 10), and the predicted label is the node that has the max value. *Hint: In PyTorch the fully connected layers are called `torch.nn.Linear()`.

**Use these training parameters:** When you train a model, train for 100 epochs with batch size of 10 and use cross entropy loss. In PyTorch's `CrossEntropyLoss` class, the [softmax operation is built in](https://pytorch.org/docs/stable/nn.html?highlight=crossentropyloss#torch.nn.CrossEntropyLoss), therefore you do not need to add a softmax function to the output layer of the network. Use the SGD optimizer with a learning rate of 0.01. 

**Making training sets:** Create training datasets of each of these sizes {500, 1000, 1500, 2000} from MNIST. Note that you should be selecting examples in such a way that you minimize bias, i.e., make sure all ten digits are equally represented in each of your training sets. To do this, you can use `load_mnist_data` function in `load_data.py` where you can adjust the number of examples per digit and the amount of training / testing data. 

*Hint: To read your MNIST dataset for training, you need to use a PyTorch `DataLoader`. To do so, you should use a custom PyTorch `Dataset` class. We included the class definition for you in the HW (`MyDataset` in `data/my_dataset.py`) You can see more details about using custom dataset in this [blog](https://stanford.edu/~shervine/blog/pytorch-how-to-generate-data-parallel) or [github repo](https://github.com/utkuozbulak/pytorch-custom-dataset-examples)). When creating a `DataLoader` set  the `shuffle` property to `True`. 

**Train one model per training set:** Train a new model for each MNIST training set you created and test it on a subset of the MNIST testing set (1000 samples). Use the same architecture for every model. For each model you train, record the loss function value every epoch. Record the time required to train for 100 epochs. From python's built in `time` module, use `time.time()`.

1. (0.5 points) Given the data from your 4 trained models, create a graph that shows the amount of training time along the y-axis and number of training examples along the x-axis.


2. (0.5 points) What happens to your training time as the number of training examples increases? Roughly how many hours would you expect it to take to train on the full MNIST training set using the same architecture on the same hardware you used to create the graph in question 1?


3. (0.5 points) Create a graph that shows classification accuracy on your testing set on the y-axis and number of training 
examples on the x-axis.


4. (0.5 points) What happens to the accuracy as the number of training examples increases?


## Thinking about deep models (3 points)

15. (0.5 points) For any binary function of binary inputs, is it possible to construct some deep network built using only perceptron activation functions that can calculate this function correctly? If so, how would you do it? If not, why not?


17. (0.5 points) Is it possible to learn any arbitrary binary function from data using a network build only using linear activation functions? If so, how would you do it? If not, why not? 

18. (2 points) An adversarial example is an example that is designed to cause your machine learning model to fail. Gradient descent ML methods (like deep networks) update their weights by descending the gradient on the loss function L(X,Y,W) with respect to W. Here, X is a training example, Y is the true label and W are the weights. Explain how you could create an adversarial example by using the gradient with respect to X instead of W.



