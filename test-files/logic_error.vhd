library IEEE;
use IEEE.STD_LOGIC_1164.ALL;

entity logic_error_example is
    Port ( clk : in STD_LOGIC;
           rst : in STD_LOGIC;
           enable : in STD_LOGIC;
           counter : out STD_LOGIC_VECTOR(3 downto 0)
         );
end logic_error_example;

architecture Behavioral of logic_error_example is
    signal count : STD_LOGIC_VECTOR(3 downto 0);
begin
    process(clk, rst)
    begin
        if rst = '1' then
            count <= (others => '0');
        elsif rising_edge(clk) then
            if enable = '1' then
                count <= count + 1;  -- Logic error: will overflow without bounds checking
            end if;
        end if;
    end process;
    
    counter <= count;
end Behavioral;
