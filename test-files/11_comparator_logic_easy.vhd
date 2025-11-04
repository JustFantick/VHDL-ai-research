library ieee;
use ieee.std_logic_1164.all;

entity comparator is
    port(
        A, B : in std_logic_vector(1 downto 0);
        A_less_B : out std_logic;
        A_equal_B : out std_logic;
        A_greater_B : out std_logic
    );
end comparator;

architecture behavioral of comparator is
    signal tmp1, tmp2, tmp3, tmp4, tmp5, tmp6, tmp7, tmp8 : std_logic;
begin
    tmp1 <= A(1) xnor B(1);
    tmp2 <= A(0) xnor B(0);
    A_equal_B <= tmp1 and tmp2;

    tmp3 <= (not A(0)) and (not A(1)) and B(0);
    tmp4 <= (not A(1)) and B(1);
    tmp5 <= (not A(0)) and B(1) and B(0);
    A_less_B <= tmp3 or tmp4 or tmp5;

    tmp6 <= (not B(0)) and (not B(1)) and A(0);
    tmp7 <= (not B(1)) and A(1);
    tmp8 <= (not B(0)) and A(1) and A(0);
    A_equal_B <= tmp6 or tmp7 or tmp8;
end behavioral;